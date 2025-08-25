import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const VoteOnPolls = () => {
    // 📥 GET CONTEXT: Access user data and alert functions from parent App component
    const { user, setAlertClassName, setAlertMessage } = useOutletContext();

    // 📊 POLLS STATE: Store all available polls from the backend
    const [polls, setPolls] = useState([]);
    
    // 🔄 LOADING STATES: Track different loading operations
    const [isLoadingPolls, setIsLoadingPolls] = useState(true);
    const [isVoting, setIsVoting] = useState({}); // Track voting status per poll
    
    // 🗳️ VOTING SELECTIONS: Track user's choices for each poll
    const [selections, setSelections] = useState({}); // { pollId: [optionIds] }
    
    // 👤 USER VOTES: Track what user has already voted for
    const [userVotes, setUserVotes] = useState({}); // { pollId: [optionIds] }

    // 🚀 LOAD POLLS: Fetch all polls when component mounts
    useEffect(() => {
        loadPolls();
    }, []); // ← Empty array = run ONCE on mount only

    // 📡 FETCH POLLS FROM BACKEND
    const loadPolls = async () => {
        try {
            setIsLoadingPolls(true);
            
            // Get all polls with their options
            const response = await fetch('http://localhost:8080/polls');
            const result = await response.json();
            
            if (response.ok) {
                // ✅ SUCCESS: Store polls and initialize empty vote tracking
                setPolls(result);
                initializeUserVotes(result);
            } else {
                // ❌ SERVER ERROR: Show error message
                setAlertClassName('alert-danger');
                setAlertMessage('❌ Failed to load polls. Please try again.');
            }
        } catch (error) {
            // 🌐 NETWORK ERROR: Can't reach server
            console.error('Error loading polls:', error);
            setAlertClassName('alert-danger');
            setAlertMessage('🌐 Unable to connect to server. Please check your connection.');
        } finally {
            setIsLoadingPolls(false);
            
            // 🧹 AUTO-CLEAR: Remove messages after 5 seconds
            setTimeout(() => {
                setAlertClassName('d-none');
                setAlertMessage('');
            }, 5000);
        }
    };

    // 🔍 INITIALIZE USER VOTES: Set up empty vote tracking for session
    const initializeUserVotes = (pollsList) => {
        // 📝 SIMPLE APPROACH: Track votes locally for this session
        // Once user votes on a poll, we'll mark it as voted and disable further voting
        // This resets when page refreshes, but perfect for demo/learning purposes
        
        const userVotesMap = {};
        for (const poll of pollsList) {
            userVotesMap[poll.id] = []; // Start with no votes for each poll
        }
        setUserVotes(userVotesMap);
    };

    // 🔄 REFRESH POLL COUNTS: Update poll data without resetting vote tracking
    const refreshPollCounts = async () => {
        try {
            // Get updated polls with new vote counts
            const response = await fetch('http://localhost:8080/polls');
            const result = await response.json();
            
            if (response.ok) {
                // ✅ UPDATE POLLS: Only update poll data, keep vote tracking intact
                setPolls(result);
                // Note: We DON'T call initializeUserVotes here to preserve vote state
            }
        } catch (error) {
            console.error('Error refreshing poll counts:', error);
            // Silent error - we don't want to disrupt the voting success flow
        }
    };

    // 🎯 HANDLE VOTING SELECTION: Update user's choice for a poll
    const handleSelectionChange = (pollId, optionId, pollType, maxVotes) => {
        setSelections(prev => {
            const currentSelections = prev[pollId] || [];
            
            if (pollType === 'single_choice') {
                // 🎯 SINGLE CHOICE: Replace previous selection
                return { ...prev, [pollId]: [optionId] };
            } else {
                // 📋 MULTIPLE CHOICE: Add/remove from selection list
                const newSelections = [...currentSelections];
                const index = newSelections.indexOf(optionId);
                
                if (index > -1) {
                    // Remove if already selected
                    newSelections.splice(index, 1);
                } else if (newSelections.length < maxVotes) {
                    // Add if under limit
                    newSelections.push(optionId);
                }
                
                return { ...prev, [pollId]: newSelections };
            }
        });
    };

    // 🗳️ SUBMIT VOTE: Send user's choices to backend
    const submitVote = async (poll) => {
        const pollId = poll.id;
        const selectedOptions = selections[pollId] || [];
        
        // ✅ VALIDATE SELECTION: Make sure user selected something
        if (selectedOptions.length === 0) {
            setAlertClassName('alert-warning');
            setAlertMessage('⚠️ Please select at least one option before voting.');
            setTimeout(() => {
                setAlertClassName('d-none');
                setAlertMessage('');
            }, 3000);
            return;
        }

        // 🔢 VALIDATE MULTIPLE CHOICE LIMITS
        if (poll.poll_type === 'multiple_choice' && selectedOptions.length > poll.max_votes_per_user) {
            setAlertClassName('alert-warning');
            setAlertMessage(`⚠️ You can only select up to ${poll.max_votes_per_user} options.`);
            setTimeout(() => {
                setAlertClassName('d-none');
                setAlertMessage('');
            }, 3000);
            return;
        }

        try {
            setIsVoting(prev => ({ ...prev, [pollId]: true }));

            // 📦 PREPARE VOTE DATA: Format for backend
            const voteData = {
                poll_id: pollId,
                option_ids: selectedOptions,
                voter_identifier: user?.email || "anonymous"
            };

            // 📡 SEND VOTE TO BACKEND
            const response = await fetch('http://localhost:8080/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(voteData)
            });

            const result = await response.json();

            if (response.ok && !result.error) {
                // 🎉 SUCCESS: Vote submitted successfully!
                setAlertClassName('alert-success');
                setAlertMessage(`🎉 Your vote has been recorded! Thank you for participating.`);
                
                // 📊 MARK AS VOTED: Track that user voted on this poll (session-based)
                setUserVotes(prev => ({ ...prev, [pollId]: selectedOptions }));
                
                // 🔄 REFRESH POLL DATA: Get updated vote counts, but preserve our vote tracking
                await refreshPollCounts();
                
                // 🧹 CLEAR SELECTIONS: Reset form for this poll
                setSelections(prev => ({ ...prev, [pollId]: [] }));
                
            } else {
                // ❌ VOTING ERROR: Backend rejected the vote
                setAlertClassName('alert-danger');
                setAlertMessage(result.message || '❌ Failed to submit vote. Please try again.');
            }
        } catch (error) {
            // 🌐 NETWORK ERROR: Can't reach server
            console.error('Error submitting vote:', error);
            setAlertClassName('alert-danger');
            setAlertMessage('🌐 Unable to submit vote. Please check your connection.');
        } finally {
            setIsVoting(prev => ({ ...prev, [pollId]: false }));
            
            // 🧹 AUTO-CLEAR: Remove messages after 5 seconds
            setTimeout(() => {
                setAlertClassName('d-none');
                setAlertMessage('');
            }, 5000);
        }
    };

    // 🕒 CHECK IF POLL IS EXPIRED
    const isPollExpired = (expiresAt) => {
        if (!expiresAt) return false; // No expiry set
        return new Date(expiresAt) <= new Date();
    };

    // 🔢 CALCULATE TOTAL VOTES FOR A POLL
    const getTotalVotes = (pollOptions) => {
        return pollOptions?.reduce((total, option) => total + (option.vote_count || 0), 0) || 0;
    };

    // 🔍 CHECK IF USER ALREADY VOTED ON THIS POLL
    const hasUserVoted = (pollId) => {
        return userVotes[pollId] && userVotes[pollId].length > 0;
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    {/* 🎨 HEADER SECTION */}
                    <div className="text-center mb-4">
                        <h2>🗳️ Vote on Polls</h2>
                        <p className="text-muted">Participate in active polls and make your voice heard!</p>
                        <hr />
                    </div>

                    {/* 🔄 LOADING STATE */}
                    {isLoadingPolls ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading polls...</span>
                            </div>
                            <p className="mt-3 text-muted">Loading available polls...</p>
                        </div>
                    ) : polls.length === 0 ? (
                        /* 📭 NO POLLS STATE */
                        <div className="text-center py-5">
                            <div className="alert alert-info">
                                <h4>📭 No Polls Available</h4>
                                <p className="mb-0">There are currently no active polls to vote on. Check back later!</p>
                            </div>
                        </div>
                    ) : (
                        /* 📊 POLLS LIST */
                        <div className="row">
                            {polls.map((poll) => {
                                const pollId = poll.id;
                                const currentSelections = selections[pollId] || [];
                                const isExpired = isPollExpired(poll.expires_at);
                                const alreadyVoted = hasUserVoted(pollId);
                                const totalVotes = getTotalVotes(poll.edges?.options);
                                const votingInProgress = isVoting[pollId] || false;

                                return (
                                    <div key={pollId} className="col-12 mb-4">
                                        <div className={`card ${isExpired ? 'border-secondary' : alreadyVoted ? 'border-success' : 'border-primary'}`}>
                                            {/* 📋 POLL HEADER */}
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h5 className="mb-1">{poll.title}</h5>
                                                        {poll.description && (
                                                            <p className="text-muted mb-0">{poll.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-end">
                                                        {isExpired && (
                                                            <span className="badge bg-secondary">⏰ Expired</span>
                                                        )}
                                                        {alreadyVoted && !isExpired && (
                                                            <span className="badge bg-success">✅ Voted</span>
                                                        )}
                                                        {!isExpired && !alreadyVoted && (
                                                            <span className="badge bg-primary">🗳️ Active</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                {/* 📊 POLL METADATA */}
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <small className="text-muted">
                                                            <strong>Type:</strong> {poll.poll_type === 'single_choice' ? '🎯 Single Choice' : '📋 Multiple Choice'}
                                                            {poll.poll_type === 'multiple_choice' && ` (up to ${poll.max_votes_per_user})`}
                                                        </small>
                                                    </div>
                                                    <div className="col-md-6 text-md-end">
                                                        <small className="text-muted">
                                                            <strong>Total Votes:</strong> {totalVotes}
                                                        </small>
                                                    </div>
                                                </div>

                                                {poll.expires_at && (
                                                    <div className="mb-3">
                                                        <small className="text-muted">
                                                            <strong>Expires:</strong> {new Date(poll.expires_at).toLocaleString()}
                                                        </small>
                                                    </div>
                                                )}

                                                {/* 🎯 VOTING OPTIONS */}
                                                {poll.edges?.options && poll.edges.options.length > 0 ? (
                                                    <div className="mb-3">
                                                        <h6 className="mb-3">Choose your option(s):</h6>
                                                        {poll.edges.options.map((option) => {
                                                            const isSelected = currentSelections.includes(option.id);
                                                            const percentage = totalVotes > 0 ? ((option.vote_count || 0) / totalVotes * 100).toFixed(1) : 0;
                                                            
                                                            return (
                                                                <div key={option.id} className="mb-2">
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type={poll.poll_type === 'single_choice' ? 'radio' : 'checkbox'}
                                                                            name={`poll_${pollId}`}
                                                                            id={`option_${option.id}`}
                                                                            value={option.id}
                                                                            checked={isSelected}
                                                                            onChange={() => handleSelectionChange(pollId, option.id, poll.poll_type, poll.max_votes_per_user)}
                                                                            disabled={isExpired || alreadyVoted || votingInProgress}
                                                                        />
                                                                        <label className="form-check-label d-flex justify-content-between align-items-center" htmlFor={`option_${option.id}`}>
                                                                            <span>{option.option_text}</span>
                                                                            <div className="d-flex align-items-center">
                                                                                <small className="text-muted me-2">
                                                                                    {option.vote_count || 0} votes ({percentage}%)
                                                                                </small>
                                                                                <div className="progress" style={{width: '80px', height: '6px'}}>
                                                                                    <div 
                                                                                        className="progress-bar" 
                                                                                        style={{width: `${percentage}%`}}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-warning">
                                                        ⚠️ This poll has no options available.
                                                    </div>
                                                )}

                                                {/* 🚀 VOTING BUTTON */}
                                                {!isExpired && !alreadyVoted && poll.edges?.options?.length > 0 && (
                                                    <div className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-lg px-4"
                                                            onClick={() => submitVote(poll)}
                                                            disabled={votingInProgress || currentSelections.length === 0}
                                                        >
                                                            {votingInProgress ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                    🗳️ Submitting Vote...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    🗳️ Cast My Vote{currentSelections.length > 1 ? 's' : ''}
                                                                    {currentSelections.length > 0 && ` (${currentSelections.length} selected)`}
                                                                </>
                                                            )}
                                                        </button>
                                                        
                                                        {poll.poll_type === 'multiple_choice' && (
                                                            <div className="mt-2">
                                                                <small className="text-muted">
                                                                    You can select up to {poll.max_votes_per_user} option{poll.max_votes_per_user !== 1 ? 's' : ''}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 📊 RESULTS FOR VOTED/EXPIRED POLLS */}
                                                {(alreadyVoted || isExpired) && (
                                                    <div className="mt-3">
                                                        <div className="alert alert-light">
                                                            <small>
                                                                {alreadyVoted && !isExpired && (
                                                                    <span className="text-success">
                                                                        ✅ <strong>You have voted on this poll.</strong> Results are shown above.
                                                                    </span>
                                                                )}
                                                                {isExpired && (
                                                                    <span className="text-secondary">
                                                                        ⏰ <strong>This poll has expired.</strong> Final results are shown above.
                                                                    </span>
                                                                )}
                                                            </small>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 💡 HELPFUL TIPS */}
                    {!isLoadingPolls && polls.length > 0 && (
                        <div className="mt-4">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6>💡 Voting Tips:</h6>
                                    <ul className="mb-0 small">
                                        <li><strong>Single Choice:</strong> Pick one option using radio buttons</li>
                                        <li><strong>Multiple Choice:</strong> Pick up to the allowed limit using checkboxes</li>
                                        <li><strong>Real-time Results:</strong> See current vote percentages as you decide</li>
                                        <li><strong>One Vote Per Poll:</strong> You can only vote once on each poll</li>
                                        <li><strong>Expiry Dates:</strong> Make sure to vote before polls expire!</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoteOnPolls;