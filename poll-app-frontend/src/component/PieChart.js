import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
    const [pollData, setPollData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { id } = useParams();

    useEffect(() => {
        // Fetch real poll data from our backend API
        const fetchPollData = async () => {
            try {
                const response = await fetch(`http://localhost:8080/poll/${id}`);
                const result = await response.json();

                if (response.ok && !result.error) {
                    // Success - we got poll data
                    setPollData(result);
                    setError("");
                } else {
                    // Error from backend
                    setError(result.message || "Failed to load poll");
                }
            } catch (error) {
                // Network error
                console.error("Error fetching poll:", error);
                setError("Unable to connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchPollData();
    }, [id]);

    // Show loading spinner while fetching
    if (loading) {
        return (
            <div className="text-center">
                <h2>Loading Poll Results...</h2>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Show error message if something went wrong
    if (error) {
        return (
            <div className="text-center">
                <h2>Error</h2>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    // Show message if no poll data
    if (!pollData) {
        return (
            <div className="text-center">
                <h2>Poll Not Found</h2>
                <p>The requested poll could not be found.</p>
            </div>
        );
    }

    // Calculate total votes for percentage calculations
    const totalVotes = pollData.edges.options.reduce((sum, option) => sum + (option.vote_count || 0), 0);

    // Prepare data for Chart.js pie chart
    const chartData = {
        labels: pollData.edges.options.map(option => option.option_text),
        datasets: [{
            data: pollData.edges.options.map(option => option.vote_count || 0),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // Chart options for better appearance
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const votes = context.parsed;
                        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
                        return `${context.label}: ${votes} votes (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="text-center">
            <h2>{pollData.title}</h2>
            <hr />
            
            {/* Pie Chart */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Pie data={chartData} options={chartOptions} />
            </div>
            
            {/* Vote Breakdown Table */}
            <div className="mt-4">
                <h5>Vote Breakdown:</h5>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Votes</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pollData.edges.options.map(option => {
                            const voteCount = option.vote_count || 0;
                            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
                            
                            return (
                                <tr key={option.id}>
                                    <td>{option.option_text}</td>
                                    <td>{voteCount}</td>
                                    <td>{percentage}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Total votes summary */}
                <div className="mt-3">
                    <strong>Total Votes: {totalVotes}</strong>
                </div>
            </div>
        </div>
    );
};

export default PieChart;
