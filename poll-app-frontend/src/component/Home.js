import { Link } from 'react-router-dom';
import PollImage from './../images/Home_poll.png'
import { useOutletContext } from 'react-router-dom';

const Home = () => {
  const { user } = useOutletContext();

  return (
    <div className="text-center">
      <h2>Explore Polls!!</h2>
      <hr />{
        user ? (
          <Link to="/VoteOnPolls">
            <img src={PollImage} alt="Polls" className="img-fluid" />
          </Link>
        ) : (
          <Link to="http://localhost:3000/login">
            <img src={PollImage} alt="Polls" className="img-fluid" />
          </Link>
        )
      }
    </div>
  );
};

export default Home;
