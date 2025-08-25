package main

import (
	"backend/ent"
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	_ "github.com/lib/pq"
)

// import (
//
//	"fmt"
//
// )
const port = 8080

type application struct {
	DSN    string
	Domain string
	DB     *ent.Client
}

func main() {
	app := application{
		Domain: "example.com",
	}
	flag.StringVar(&app.DSN, "dsn", "host=localhost port=5432 user=postgres password=postgres dbname=polls_new sslmode=disable connect_timeout=5", "PostgreSQL connection string")

	flag.Parse()

	// Create Ent client
	client, err := ent.Open("postgres", app.DSN)
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
	defer client.Close()

	// Run database migrations
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := client.Schema.Create(ctx); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}

	// Seed database with sample data
	if err := seedDatabase(ctx, client); err != nil {
		log.Printf("Warning: Could not seed database: %v", err)
	}

	app.DB = client

	log.Println("Connected to database successfully")
	log.Println("Database schema created/updated")
	log.Println("Starting application on port", port)
	fmt.Println("DOMAIN NAME:", app.Domain)

	err = http.ListenAndServe(fmt.Sprintf(":%d", port), app.routes())
	if err != nil {
		log.Fatal(err)
	}
}

// seedDatabase creates sample users, polls, and votes if they don't exist
func seedDatabase(ctx context.Context, client *ent.Client) error {
	// Check if we already have data
	userCount, err := client.User.Query().Count(ctx)
	if err != nil {
		return fmt.Errorf("failed to count users: %w", err)
	}

	if userCount > 0 {
		log.Println("Database already has data, skipping seeding")
		return nil
	}

	log.Println("Seeding database with sample data...")

	// Create users
	users := []struct {
		email    string
		password string
	}{
		{"admin@example.com", "admin123"},
		{"john@email.com", "password123"},
		{"sarah@email.com", "password123"},
		{"mike@email.com", "password123"},
		{"emma@email.com", "password123"},
		{"alex@email.com", "password123"},
		{"lisa@email.com", "password123"},
		{"david@email.com", "password123"},
	}

	var createdUsers []*ent.User
	for _, userData := range users {
		user, err := client.User.Create().
			SetEmail(userData.email).
			SetPassword(userData.password).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to create user %s: %w", userData.email, err)
		}
		createdUsers = append(createdUsers, user)
		log.Printf("Created user: %s", user.Email)
	}

	// Create polls with options
	pollsData := []struct {
		title       string
		description string
		pollType    string
		maxVotes    int
		options     []string
	}{
		{
			"Favorite Programming Language",
			"What's your go-to language for backend development?",
			"single_choice",
			1,
			[]string{"Go", "Python", "Node.js", "Java", "C#", "Rust"},
		},
		{
			"Preferred Pizza Toppings",
			"Which toppings do you love? (Choose up to 3)",
			"multiple_choice",
			3,
			[]string{"Pepperoni", "Mushrooms", "Bell Peppers", "Olives", "Pineapple", "Sausage"},
		},
		{
			"Best Development IDE",
			"Which IDE/editor do you use most?",
			"single_choice",
			1,
			[]string{"VS Code", "IntelliJ IDEA", "Vim/Neovim", "Sublime Text", "Atom"},
		},
		{
			"Favorite Movie Genres",
			"What genres do you enjoy? (Select multiple)",
			"multiple_choice",
			4,
			[]string{"Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Documentary"},
		},
		{
			"Remote Work Preference",
			"How do you prefer to work?",
			"single_choice",
			1,
			[]string{"Fully Remote", "Hybrid (2-3 days office)", "Mostly Office", "Flexible"},
		},
		{
			"Favorite Social Media Platform",
			"Which platform do you use most?",
			"single_choice",
			1,
			[]string{"Twitter/X", "LinkedIn", "Instagram", "TikTok", "Reddit", "YouTube"},
		},
	}

	var createdPolls []*ent.Poll

	for _, pollData := range pollsData {
		// Create poll
		poll, err := client.Poll.Create().
			SetTitle(pollData.title).
			SetDescription(pollData.description).
			SetPollType(pollData.pollType).
			SetCreatedBy(createdUsers[0].Email). // Created by admin
			SetMaxVotesPerUser(pollData.maxVotes).
			SetExpiresAt(time.Now().Add(30 * 24 * time.Hour)). // Expires in 30 days
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to create poll %s: %w", pollData.title, err)
		}
		createdPolls = append(createdPolls, poll)

		// Create options for this poll
		var pollOptions []*ent.PollOption
		for _, optionText := range pollData.options {
			option, err := client.PollOption.Create().
				SetOptionText(optionText).
				SetVoteCount(0).
				SetPoll(poll).
				Save(ctx)
			if err != nil {
				return fmt.Errorf("failed to create option %s: %w", optionText, err)
			}
			pollOptions = append(pollOptions, option)
		}

		log.Printf("Created poll: %s with %d options", poll.Title, len(pollOptions))
	}

	// Create realistic votes
	rand.Seed(time.Now().UnixNano())

	// Vote patterns for different polls
	votePatterns := []struct {
		pollIndex     int
		distributions []float64 // Percentage for each option
	}{
		{0, []float64{0.35, 0.25, 0.20, 0.10, 0.05, 0.05}},       // Programming: Go wins
		{1, []float64{0.20, 0.18, 0.15, 0.12, 0.10, 0.25}},       // Pizza: More even
		{2, []float64{0.45, 0.25, 0.15, 0.10, 0.05}},             // IDE: VS Code wins
		{3, []float64{0.18, 0.22, 0.15, 0.20, 0.08, 0.12, 0.05}}, // Movies: Spread out
		{4, []float64{0.40, 0.35, 0.15, 0.10}},                   // Remote: Remote/Hybrid preferred
		{5, []float64{0.15, 0.20, 0.18, 0.12, 0.25, 0.10}},       // Social: Even spread
	}

	for _, pattern := range votePatterns {
		poll := createdPolls[pattern.pollIndex]

		// Get options for this poll
		pollOptions, err := poll.QueryOptions().All(ctx)
		if err != nil {
			return fmt.Errorf("failed to get options for poll %d: %w", poll.ID, err)
		}

		// Create votes for each user
		for _, user := range createdUsers {
			// Not every user votes on every poll (more realistic)
			if rand.Float64() < 0.85 { // 85% chance user votes on this poll

				if poll.PollType == "single_choice" {
					// Single choice: pick one option based on distribution
					optionIndex := chooseOptionByDistribution(pattern.distributions)
					if optionIndex < len(pollOptions) {
						_, err := client.Vote.Create().
							SetVoterIdentifier(user.Email).
							SetPoll(poll).
							SetOption(pollOptions[optionIndex]).
							Save(ctx)
						if err != nil {
							log.Printf("Warning: Failed to create vote: %v", err)
							continue
						}

						// Update vote count
						_, err = pollOptions[optionIndex].Update().
							AddVoteCount(1).
							Save(ctx)
						if err != nil {
							log.Printf("Warning: Failed to update vote count: %v", err)
						}
					}
				} else {
					// Multiple choice: choose multiple options
					maxVotes := poll.MaxVotesPerUser
					numVotes := rand.Intn(maxVotes) + 1 // At least 1 vote

					chosen := make(map[int]bool)
					for i := 0; i < numVotes && i < len(pollOptions); i++ {
						optionIndex := chooseOptionByDistribution(pattern.distributions)
						if !chosen[optionIndex] && optionIndex < len(pollOptions) {
							chosen[optionIndex] = true

							_, err := client.Vote.Create().
								SetVoterIdentifier(user.Email).
								SetPoll(poll).
								SetOption(pollOptions[optionIndex]).
								Save(ctx)
							if err != nil {
								log.Printf("Warning: Failed to create vote: %v", err)
								continue
							}

							// Update vote count
							_, err = pollOptions[optionIndex].Update().
								AddVoteCount(1).
								Save(ctx)
							if err != nil {
								log.Printf("Warning: Failed to update vote count: %v", err)
							}
						}
					}
				}
			}
		}

		log.Printf("Created votes for poll: %s", poll.Title)
	}

	log.Printf("Database seeding completed! Created %d users, %d polls, and votes", len(createdUsers), len(createdPolls))
	return nil
}

// chooseOptionByDistribution selects an option index based on probability distribution
func chooseOptionByDistribution(distributions []float64) int {
	r := rand.Float64()
	cumulative := 0.0

	for i, prob := range distributions {
		cumulative += prob
		if r <= cumulative {
			return i
		}
	}

	// Fallback to last option
	return len(distributions) - 1
}
