package main

import (
	"backend/ent"
	"backend/ent/poll"
	"backend/ent/user"
	"backend/ent/vote"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/julienschmidt/httprouter"
)

func (app *application) Home(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var payload struct {
		Message string `json:"message"`
		Status  string `json:"status"`
		Version string `json:"version"`
	}
	payload.Message = "Welcome to the Home Page"
	payload.Status = "success"
	payload.Version = "1.0.0"

	// Set the response header and encode the payload as JSON
	_ = app.writeJSON(w, http.StatusOK, payload)
}

func (app *application) About(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprintln(w, "About Page")
	fmt.Fprintln(w, "Domain:", app.Domain)
}

func (app *application) AllPolls(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Use Ent to get all polls with their options
	polls, err := app.DB.Poll.Query().
		WithOptions().                 // Load related poll options
		Order(ent.Desc("created_at")). // Order by newest first using field name
		All(r.Context())

	if err != nil {
		app.errorJSON(w, err)
		return
	}
	_ = app.writeJSON(w, http.StatusOK, polls)
}

// GetPoll handles getting a single poll by ID for pie chart display
func (app *application) GetPoll(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	idStr := ps.ByName("id")

	// Convert string ID to integer
	pollID, err := strconv.Atoi(idStr)
	if err != nil {
		app.errorJSON(w, errors.New("invalid poll ID"), http.StatusBadRequest)
		return
	}

	// Use Ent to get poll with options
	pollData, err := app.DB.Poll.Query().
		Where(poll.IDEQ(pollID)). // Find poll by ID
		WithOptions().            // Load related options
		Only(r.Context())         // Get exactly one result

	if err != nil {
		if ent.IsNotFound(err) {
			// Poll not found
			app.errorJSON(w, errors.New("poll not found"), http.StatusNotFound)
		} else {
			// Database error
			app.errorJSON(w, err)
		}
		return
	}

	// Success - return poll with options
	app.writeJSON(w, http.StatusOK, pollData)
}

// Login handles user authentication
func (app *application) Login(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Simple login request struct
	var loginReq struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Parse the JSON body
	err := app.readJSON(w, r, &loginReq)
	if err != nil {
		app.errorJSON(w, err, http.StatusBadRequest)
		return
	}

	// Use Ent to check credentials
	userData, err := app.DB.User.Query().
		Where(user.EmailEQ(loginReq.Email)).       // Find user by email
		Where(user.PasswordEQ(loginReq.Password)). // Check password matches
		Only(r.Context())                          // Get exactly one user

	if err != nil {
		if ent.IsNotFound(err) {
			// Invalid credentials
			app.errorJSON(w, errors.New("invalid email or password"), http.StatusUnauthorized)
		} else {
			// Database error
			fmt.Println("Database error:", err)
			app.errorJSON(w, err, http.StatusInternalServerError)
		}
		return
	}

	// Success - return user info
	app.writeJSON(w, http.StatusOK, JSONResponse{
		Error:   false,
		Message: "Login successful",
		Data:    userData,
	})
}

// CreatePoll handles creating a new poll with options
func (app *application) CreatePoll(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Define the structure for the poll creation request
	var createReq struct {
		Title           string   `json:"title"`
		Description     string   `json:"description"`
		PollType        string   `json:"poll_type"`
		CreatedBy       string   `json:"created_by"`
		MaxVotesPerUser int      `json:"max_votes_per_user"`
		ExpiresAt       *string  `json:"expires_at"` // pointer to handle null
		Options         []string `json:"options"`
	}

	// Parse the JSON body
	err := app.readJSON(w, r, &createReq)
	if err != nil {
		app.errorJSON(w, err, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if createReq.Title == "" {
		app.errorJSON(w, errors.New("poll title is required"), http.StatusBadRequest)
		return
	}

	if len(createReq.Options) < 2 {
		app.errorJSON(w, errors.New("at least 2 options are required"), http.StatusBadRequest)
		return
	}

	// Validate poll type
	if createReq.PollType != "single_choice" && createReq.PollType != "multiple_choice" {
		app.errorJSON(w, errors.New("poll_type must be 'single_choice' or 'multiple_choice'"), http.StatusBadRequest)
		return
	}

	// Validate max votes for multiple choice polls
	if createReq.PollType == "multiple_choice" && createReq.MaxVotesPerUser < 1 {
		app.errorJSON(w, errors.New("max_votes_per_user must be at least 1 for multiple choice polls"), http.StatusBadRequest)
		return
	}

	// Parse expiry date if provided
	var expiresAt *time.Time
	if createReq.ExpiresAt != nil && *createReq.ExpiresAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, *createReq.ExpiresAt)
		if err != nil {
			app.errorJSON(w, errors.New("invalid expires_at format, use RFC3339"), http.StatusBadRequest)
			return
		}

		// Check if expiry date is in the future
		if parsedTime.Before(time.Now()) {
			app.errorJSON(w, errors.New("expires_at must be in the future"), http.StatusBadRequest)
			return
		}

		expiresAt = &parsedTime
	}

	// Set default values
	if createReq.PollType == "" {
		createReq.PollType = "single_choice"
	}
	if createReq.MaxVotesPerUser == 0 {
		createReq.MaxVotesPerUser = 1
	}
	if createReq.CreatedBy == "" {
		createReq.CreatedBy = "anonymous"
	}

	// Create the poll using Ent
	pollBuilder := app.DB.Poll.Create().
		SetTitle(createReq.Title).
		SetPollType(createReq.PollType).
		SetCreatedBy(createReq.CreatedBy).
		SetMaxVotesPerUser(createReq.MaxVotesPerUser)

	// Add optional fields
	if createReq.Description != "" {
		pollBuilder = pollBuilder.SetDescription(createReq.Description)
	}
	if expiresAt != nil {
		pollBuilder = pollBuilder.SetExpiresAt(*expiresAt)
	}

	// Create the poll
	createdPoll, err := pollBuilder.Save(r.Context())
	if err != nil {
		fmt.Printf("Error creating poll: %v\n", err)
		app.errorJSON(w, errors.New("failed to create poll"), http.StatusInternalServerError)
		return
	}

	// Create poll options
	for _, optionText := range createReq.Options {
		if optionText != "" { // Skip empty options
			_, err := app.DB.PollOption.Create().
				SetOptionText(optionText).
				SetVoteCount(0).
				SetPoll(createdPoll).
				Save(r.Context())
			if err != nil {
				fmt.Printf("Error creating poll option: %v\n", err)
				// If option creation fails, we could optionally delete the poll
				// For now, just log the error and continue
			}
		}
	}

	// Fetch the created poll with its options for the response
	pollWithOptions, err := app.DB.Poll.Query().
		Where(poll.IDEQ(createdPoll.ID)).
		WithOptions().
		Only(r.Context())
	if err != nil {
		// Poll was created but we can't fetch it with options - still return success
		fmt.Printf("Warning: Created poll but couldn't fetch with options: %v\n", err)
		pollWithOptions = createdPoll
	}

	// Success response
	app.writeJSON(w, http.StatusCreated, JSONResponse{
		Error:   false,
		Message: "Poll created successfully",
		Data:    pollWithOptions,
	})
}

// VoteOnPoll handles voting on a poll
// 🗳️ This endpoint allows users to cast votes on polls
func (app *application) VoteOnPoll(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// 📋 VOTE REQUEST STRUCTURE: What the frontend sends us
	var voteReq struct {
		PollID          int    `json:"poll_id"`          // Which poll to vote on
		OptionIDs       []int  `json:"option_ids"`       // Which options to vote for (array for multiple choice)
		VoterIdentifier string `json:"voter_identifier"` // Who is voting (usually email)
	}

	// 🔍 PARSE REQUEST: Convert JSON body to our struct
	err := app.readJSON(w, r, &voteReq)
	if err != nil {
		app.errorJSON(w, err, http.StatusBadRequest)
		return
	}

	// ✅ BASIC VALIDATION: Check required fields
	if voteReq.PollID == 0 {
		app.errorJSON(w, errors.New("poll_id is required"), http.StatusBadRequest)
		return
	}
	if len(voteReq.OptionIDs) == 0 {
		app.errorJSON(w, errors.New("at least one option must be selected"), http.StatusBadRequest)
		return
	}
	if voteReq.VoterIdentifier == "" {
		app.errorJSON(w, errors.New("voter_identifier is required"), http.StatusBadRequest)
		return
	}

	// 🔍 GET POLL: Fetch the poll with its options from database
	pollData, err := app.DB.Poll.Query().
		Where(poll.IDEQ(voteReq.PollID)). // Find poll by ID
		WithOptions().                    // Include poll options
		Only(r.Context())                 // Get exactly one result

	if err != nil {
		if ent.IsNotFound(err) {
			app.errorJSON(w, errors.New("poll not found"), http.StatusNotFound)
		} else {
			app.errorJSON(w, err, http.StatusInternalServerError)
		}
		return
	}

	// ⏰ CHECK EXPIRY: Make sure poll is still accepting votes
	// For optional time fields in Ent, zero time means "no expiry set"
	if !pollData.ExpiresAt.IsZero() && time.Now().After(pollData.ExpiresAt) {
		app.errorJSON(w, errors.New("poll has expired"), http.StatusBadRequest)
		return
	}

	// 🔍 CHECK EXISTING VOTES: See what this user already voted for
	existingVotes, err := app.DB.Vote.Query().
		Where(vote.VoterIdentifierEQ(voteReq.VoterIdentifier)). // Same voter
		Where(vote.HasPollWith(poll.IDEQ(voteReq.PollID))).     // Same poll
		All(r.Context())

	if err != nil {
		app.errorJSON(w, err, http.StatusInternalServerError)
		return
	}

	// 🚫 PREVENT DUPLICATE VOTING: For single choice, no existing votes allowed
	if pollData.PollType == "single_choice" && len(existingVotes) > 0 {
		app.errorJSON(w, errors.New("you have already voted on this poll"), http.StatusBadRequest)
		return
	}

	// 🔢 VALIDATE MULTIPLE CHOICE LIMITS: Check if user would exceed max votes
	if pollData.PollType == "multiple_choice" {
		totalVotesAfter := len(existingVotes) + len(voteReq.OptionIDs)
		if totalVotesAfter > pollData.MaxVotesPerUser {
			app.errorJSON(w,
				fmt.Errorf("you can only vote for %d options total, but you're trying to vote for %d",
					pollData.MaxVotesPerUser, totalVotesAfter),
				http.StatusBadRequest)
			return
		}
	}

	// 🎯 VALIDATE OPTION IDS: Make sure all selected options belong to this poll
	validOptionIDs := make(map[int]bool)
	for _, option := range pollData.Edges.Options {
		validOptionIDs[option.ID] = true
	}

	for _, optionID := range voteReq.OptionIDs {
		if !validOptionIDs[optionID] {
			app.errorJSON(w,
				fmt.Errorf("option ID %d does not belong to poll %d", optionID, voteReq.PollID),
				http.StatusBadRequest)
			return
		}
	}

	// 🚫 CHECK FOR DUPLICATE VOTES: Make sure user isn't voting for same option twice
	existingOptionIDs := make(map[int]bool)
	for _, existingVote := range existingVotes {
		// Get the option ID for each existing vote
		voteWithOption, err := app.DB.Vote.Query().
			Where(vote.IDEQ(existingVote.ID)).
			WithOption().
			Only(r.Context())
		if err == nil && voteWithOption.Edges.Option != nil {
			existingOptionIDs[voteWithOption.Edges.Option.ID] = true
		}
	}

	for _, optionID := range voteReq.OptionIDs {
		if existingOptionIDs[optionID] {
			app.errorJSON(w,
				fmt.Errorf("you have already voted for option %d", optionID),
				http.StatusBadRequest)
			return
		}
	}

	// 🗳️ CREATE VOTES: All validation passed, now create the vote records
	var createdVotes []*ent.Vote

	for _, optionID := range voteReq.OptionIDs {
		// Create the vote record
		newVote, err := app.DB.Vote.Create().
			SetVoterIdentifier(voteReq.VoterIdentifier).
			SetPollID(voteReq.PollID).
			SetOptionID(optionID).
			Save(r.Context())

		if err != nil {
			app.errorJSON(w,
				fmt.Errorf("failed to create vote for option %d: %v", optionID, err),
				http.StatusInternalServerError)
			return
		}
		createdVotes = append(createdVotes, newVote)

		// Update the vote count on the option
		_, err = app.DB.PollOption.UpdateOneID(optionID).
			AddVoteCount(1). // Increment vote count by 1
			Save(r.Context())

		if err != nil {
			// Note: In production, you might want to use database transactions
			// to ensure vote creation and count updates happen atomically
			fmt.Printf("Warning: Created vote but failed to update count for option %d: %v\n", optionID, err)
		}
	}

	// 📊 PREPARE RESPONSE: Get updated poll data with new vote counts
	updatedPoll, err := app.DB.Poll.Query().
		Where(poll.IDEQ(voteReq.PollID)).
		WithOptions().
		Only(r.Context())

	if err != nil {
		// Votes were created successfully, but we can't fetch updated data
		fmt.Printf("Warning: Votes created but couldn't fetch updated poll: %v\n", err)
		updatedPoll = pollData
	}

	// 🎉 SUCCESS RESPONSE: Let frontend know voting worked
	responseData := struct {
		Message    string      `json:"message"`
		Poll       *ent.Poll   `json:"poll"`
		VotesCount int         `json:"votes_count"`
		NewVotes   []*ent.Vote `json:"new_votes"`
	}{
		Message:    fmt.Sprintf("Successfully voted for %d option(s)", len(voteReq.OptionIDs)),
		Poll:       updatedPoll,
		VotesCount: len(createdVotes),
		NewVotes:   createdVotes,
	}

	app.writeJSON(w, http.StatusCreated, JSONResponse{
		Error:   false,
		Message: "Vote cast successfully",
		Data:    responseData,
	})
}
