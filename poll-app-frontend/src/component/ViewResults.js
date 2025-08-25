import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
const ViewResults = () => {
    const [pollResults, setPollResults] = useState([]);

    useEffect(() => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        fetch("http://localhost:8080/polls", {
            method: "GET",
            headers: headers,
        })
            .then((response) => response.json())
            .then((data) => {
                setPollResults(data);
            })
            .catch((error) => {
                console.error("Error fetching poll results:", error);
            });
    }, []);

  return (
    <div className="text-center">
      <h2>View Poll Results</h2>
      <hr />
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Poll Question</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {pollResults && pollResults.map((poll) => (
            <tr key={poll.id}>
              <td><Link to={`/poll/${poll.id}`}>{poll.title}</Link></td>
              <td>
                <ul>
                  {poll.edges && poll.edges.options && poll.edges.options.map((option) => (
                    <li key={option.id}>
                      {option.option_text}: {option.vote_count || 0} votes
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewResults;
