import React, { useState } from 'react';
import { useNavigate , useOutletContext} from 'react-router-dom';
import Input from './form/Input';
import TextArea from './form/TextArea';

const MakePolls = () => {
    // Get user data and alert functions from the parent App component
    const { user, setAlertClassName, setAlertMessage } = useOutletContext();
    const navigate = useNavigate();

    // 📋 FORM STATE: Store all the poll information
    const [pollData, setPollData] = useState({
        title: '',                        // The main poll question
        description: '',                  // Optional extra details about the poll
        poll_type: 'single_choice',      // 'single_choice' or 'multiple_choice'
        max_votes_per_user: 1,           // How many options a user can select (for multiple choice)
        expires_at: ''                   // When the poll should stop accepting votes
    });

    // 🎯 POLL OPTIONS: Dynamic list of answer choices (starts with 2 empty options)
    const [options, setOptions] = useState(['', '']);
    
    // 🔄 LOADING STATE: Track if we're currently submitting the form
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ❌ ERROR STATE: Store any validation errors to show to the user
    const [errors, setErrors] = useState({});

    // 📝 HANDLE FORM INPUT CHANGES: Update poll data when user types
    const handleChange = (event) => {
        const { name, value, type } = event.target;
        
        // Update the poll data state
        setPollData(prev => ({
            ...prev,
            // Convert numbers properly, otherwise keep as string
            [name]: type === 'number' ? parseInt(value) || 1 : value
        }));

        // 🧹 CLEAR ERROR: Remove error message when user starts fixing the field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // 🎯 HANDLE OPTION CHANGES: Update individual poll options when user types
    const handleOptionChange = (index, value) => {
        const newOptions = [...options];  // Create a copy of current options
        newOptions[index] = value;         // Update the specific option
        setOptions(newOptions);            // Save the updated options
    };

    // ➕ ADD NEW OPTION: Let users add more answer choices (up to 10)
    const addOption = () => {
        if (options.length < 10) {  // Limit to 10 options for usability
            setOptions([...options, '']);
        }
    };

    // ➖ REMOVE OPTION: Let users remove answer choices (minimum 2 required)
    const removeOption = (index) => {
        if (options.length > 2) {  // Always keep at least 2 options
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    // ✅ FORM VALIDATION: Check if all required fields are filled correctly
    const validateForm = () => {
        const newErrors = {};

        // 📝 CHECK TITLE: Must have a poll question
        if (!pollData.title.trim()) {
            newErrors.title = 'Please enter a poll question';
        }

        // 🔢 CHECK MAX VOTES: For multiple choice polls, must allow at least 1 vote
        if (pollData.poll_type === 'multiple_choice' && pollData.max_votes_per_user < 1) {
            newErrors.max_votes_per_user = 'Must allow at least 1 vote per user';
        }

        // 🎯 CHECK OPTIONS: Need at least 2 non-empty options
        const validOptions = options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            newErrors.options = 'Please provide at least 2 answer options';
        }

        // 🔍 CHECK DUPLICATES: All options must be unique
        const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size !== validOptions.length) {
            newErrors.options = 'Each option must be different';
        }

        // 📅 CHECK EXPIRY DATE: If provided, must be in the future
        if (pollData.expires_at) {
            const expiryDate = new Date(pollData.expires_at);
            const now = new Date();
            if (expiryDate <= now) {
                newErrors.expires_at = 'Expiry date must be in the future';
            }
        }

        // Save errors and return true if no errors found
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 🚀 SUBMIT FORM: Send the poll data to our backend
    const handleSubmit = async (event) => {
        event.preventDefault();  // Prevent page reload
        
        // ✅ VALIDATE FIRST: Don't submit if there are errors
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);  // Show loading spinner

        try {
            // 📦 PREPARE DATA: Clean up and format the poll data for the server
            const validOptions = options.filter(opt => opt.trim() !== '');  // Remove empty options
            
            const pollPayload = {
                ...pollData,  // Include all form fields
                created_by: user.email || "anonymous",  // Use logged-in user or 'anonymous'
                options: validOptions.map(opt => opt.trim()),  // Clean up option text
                // Convert date to server format (ISO string) or null if not provided
                expires_at: pollData.expires_at ? new Date(pollData.expires_at).toISOString() : null
            };

            // 📡 SEND TO SERVER: POST request to create the poll
            const response = await fetch('http://localhost:8080/polls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',  // Tell server we're sending JSON
                },
                body: JSON.stringify(pollPayload)  // Convert data to JSON string
            });

            const result = await response.json();  // Get server response

            if (response.ok && !result.error) {
                // 🎉 SUCCESS: Poll was created!
                setAlertClassName('alert-success');
                setAlertMessage('🎉 Poll created successfully!');
                
                // 🧹 CLEAR FORM: Reset all fields for next poll
                setPollData({
                    title: '',
                    description: '',
                    poll_type: 'single_choice',
                    max_votes_per_user: 1,
                    expires_at: ''
                });
                setOptions(['', '']);
                
                // ↩️ REDIRECT: Go to view polls after 2 seconds
                setTimeout(() => {
                    setAlertClassName('d-none');
                    setAlertMessage('');
                    navigate('/ViewResults');
                }, 2000);

            } else {
                // ❌ SERVER ERROR: Something went wrong on the backend
                setAlertClassName('alert-danger');
                setAlertMessage(result.message || '❌ Failed to create poll. Please try again.');
            }
        } catch (error) {
            // 🌐 NETWORK ERROR: Can't reach the server
            console.error('Error creating poll:', error);
            setAlertClassName('alert-danger');
            setAlertMessage('🌐 Unable to connect to server. Please check your connection.');
        } finally {
            setIsSubmitting(false);  // Hide loading spinner
            
            // 🧹 AUTO-CLEAR: Remove error messages after 5 seconds
            setTimeout(() => {
                setAlertClassName('d-none');
                setAlertMessage('');
            }, 5000);
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    {/* 🎨 HEADER SECTION */}
                    <div className="text-center mb-4">
                        <h2>📊 Create New Poll</h2>
                        <p className="text-muted">Build an engaging poll to gather opinions from your audience</p>
                        <hr />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 📝 POLL QUESTION SECTION */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">📝 Poll Question</h5>
                            </div>
                            <div className="card-body">
                                <Input
                                    title="Main Question *"
                                    type="text"
                                    name="title"
                                    value={pollData.title}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="e.g., What's your favorite programming language?"
                                    errorDiv={errors.title ? "text-danger" : "d-none"}
                                    errorMessage={errors.title}
                                />
                                <small className="form-text text-muted">
                                    💡 Tip: Keep your question clear and specific for better responses
                                </small>

                                <TextArea
                                    title="Additional Details (Optional)"
                                    name="description"
                                    value={pollData.description}
                                    onChange={handleChange}
                                    placeholder="Add context, background, or instructions for your poll..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* ⚙️ POLL SETTINGS SECTION */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">⚙️ Poll Settings</h5>
                            </div>
                            <div className="card-body">
                                {/* Poll Type */}
                                <div className="mb-3">
                                    <label htmlFor="poll_type" className="form-label">How many answers can people choose? *</label>
                                    <select
                                        className="form-select"
                                        id="poll_type"
                                        name="poll_type"
                                        value={pollData.poll_type}
                                        onChange={handleChange}
                                    >
                                        <option value="single_choice">🎯 Single Choice - People pick only ONE option</option>
                                        <option value="multiple_choice">📋 Multiple Choice - People can pick SEVERAL options</option>
                                    </select>
                                    <div className="mt-2">
                                        {pollData.poll_type === 'single_choice' ? (
                                            <small className="text-info">
                                                <i className="fas fa-info-circle"></i> Perfect for "either/or" questions or picking favorites
                                            </small>
                                        ) : (
                                            <small className="text-info">
                                                <i className="fas fa-info-circle"></i> Great for collecting multiple preferences or feedback
                                            </small>
                                        )}
                                    </div>
                                </div>

                                {/* Max Votes for Multiple Choice */}
                                {pollData.poll_type === 'multiple_choice' && (
                                    <div className="alert alert-info">
                                        <Input
                                            title="Maximum options people can select *"
                                            type="number"
                                            name="max_votes_per_user"
                                            value={pollData.max_votes_per_user}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="e.g., 3"
                                            min="1"
                                            max="10"
                                            errorDiv={errors.max_votes_per_user ? "text-danger" : "d-none"}
                                            errorMessage={errors.max_votes_per_user}
                                        />
                                        <small className="text-muted">
                                            🔢 How many options can each person select? (between 1 and 10)
                                        </small>
                                    </div>
                                )}

                                {/* Expiry Date */}
                                <Input
                                    title="Poll Expiry Date (Optional)"
                                    type="datetime-local"
                                    name="expires_at"
                                    value={pollData.expires_at}
                                    onChange={handleChange}
                                    className="form-control"
                                    errorDiv={errors.expires_at ? "text-danger" : "d-none"}
                                    errorMessage={errors.expires_at}
                                />
                                <small className="form-text text-muted">
                                    📅 When should voting stop? Leave empty for polls that never expire
                                </small>
                            </div>
                        </div>

                        {/* 🎯 POLL OPTIONS SECTION */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">🎯 Answer Options</h5>
                                <small className="text-muted">Add the choices people can vote for</small>
                            </div>
                            <div className="card-body">
                                {options.map((option, index) => (
                                    <div key={index} className="input-group mb-3">
                                        <span className="input-group-text" style={{minWidth: '80px'}}>
                                            Choice {index + 1}
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Enter option ${index + 1} (e.g., ${index === 0 ? 'Python' : index === 1 ? 'JavaScript' : 'Java'})...`}
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={() => removeOption(index)}
                                                title="Remove this option"
                                            >
                                                🗑️ Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                <div className="text-center mb-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={addOption}
                                        disabled={options.length >= 10}
                                    >
                                        ➕ Add Another Option ({options.length}/10)
                                    </button>
                                </div>
                                
                                {errors.options && (
                                    <div className="alert alert-danger">
                                        <i className="fas fa-exclamation-triangle"></i> {errors.options}
                                    </div>
                                )}
                                
                                <div className="alert alert-light">
                                    <small>
                                        <strong>💡 Tips for great options:</strong><br/>
                                        • Keep them short and clear<br/>
                                        • Make sure each option is different<br/>
                                        • You need at least 2 options (up to 10 maximum)<br/>
                                        • Empty options will be automatically removed
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* 🚀 SUBMIT SECTION */}
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Ready to create your poll?</h5>
                                <p className="text-muted mb-4">
                                    Your poll will be immediately available for voting once created
                                </p>
                                
                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg px-5"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            🚀 Creating Your Poll...
                                        </>
                                    ) : (
                                        <>
                                            📊 Create My Poll
                                        </>
                                    )}
                                </button>
                                
                                <div className="mt-3">
                                    <small className="text-muted">
                                        Once created, people can start voting immediately and you'll see live results!
                                    </small>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MakePolls;