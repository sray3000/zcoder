import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark } from 'lucide-react';
import axios from 'axios';
import '../styles/global.css';
import '../styles/dashboard.css';

function ProblemSet() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedTags, setSelectedTags] = useState([]);
  const [problems, setProblems] = useState([]);
  const [bookmarkedProblems, setBookmarkedProblems] = useState(new Set());

  useEffect(() => {
    Promise.all([
      axios.get(`${baseURL}/api/questions`),
      currentUser ? axios.get(`${baseURL}/api/users/${currentUser.id}/bookmarks`) : Promise.resolve({ data: [] })
    ]).then(([problemsRes, bookmarksRes]) => {
      console.log('problemsRes:', problemsRes.data);

      const questions = Array.isArray(problemsRes.data) ? problemsRes.data : [];
      const bookmarks = Array.isArray(bookmarksRes.data) ? bookmarksRes.data : [];

      
      // console.log('bookmarksRes:', bookmarksRes.data);


      setProblems(questions);
      setBookmarkedProblems(new Set(bookmarks.map(b => `${b.contestId}${b.problemIndex}`))); // handles both _id and id
    }).catch(err => console.error('Error fetching data:', err));
  }, [currentUser]);

  const handleTagChange = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  const handleBookmark = async (problemId, problemKey) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.post(`${baseURL}/api/users/${currentUser.id}/bookmarks`, {
        problemId,
      });

      // Toggle locally based on backend response
      if (res.data.bookmarked) {
        setBookmarkedProblems(prev => new Set([...prev, problemKey]));
      } else {
        setBookmarkedProblems(prev => {
          const next = new Set(prev);
          next.delete(problemKey);
          return next;
        });
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const filteredProblems = selectedTags.length > 0
    ? problems.filter(problem => 
        selectedTags.every(tag => problem.tags.includes(tag))
      )
    : problems;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container dashboard-container">

          <div className="user-info">
            <h1>Welcome to ZCoder</h1>
            <div className='right_portion'>
              <span>{currentUser?.username}</span>
              <button onClick={handleLogout} className="btn btn-outline">Logout</button>
            </div>
          </div>
          <div className='left_portion'>
            <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
            <button className="btn btn-outline" onClick={() => window.location.href = '/editor'}>Go to Code Editor</button>
          </div>
        </div>
      </header>
      <br></br>

      <div className="container">        
        <div className="problem-filters">
          <div className="tags-filter">
            <h3>Filter by Tags:</h3>
            <div className="tags-container">
              {[...new Set(problems.flatMap(p => p.tags))].map(tag => (
                <label key={tag} className="tag-checkbox">
                  <input
                    type="checkbox"
                    className='tag-box'
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                  />
                  <span className="tag-label">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <br></br>

        <div className="problem-grid">
          {console.log("filteredProblems:", filteredProblems)}

          {filteredProblems.length === 0 && (
            <p style={{ color: 'red' }}>No problems found to display.</p>
          )}
          {filteredProblems.map((problem) => {
            const problemKey = `${problem.contestId}${problem.problemIndex}`;
            const problemId = problem._id;

            return (
            <div key={problemKey} className="problem-card-wrapper">
            <Link 
              to={`/editor/${problemKey}`}
              className="problem-card"
            >
              <div className="problem-difficulty" style={{ backgroundColor: getRatingColor(problem.rating) }}>
                {problem.rating}
              </div>
              <h3 className="problem-title">{problem.title}</h3>
              <div className="problem-tags">
                {problem.tags.map((tag, index) => (
                  <span key={index} className="problem-tag">{tag}</span>
                ))}
              </div>
            </Link>
              <button 
                className={`bookmark-button ${bookmarkedProblems.has(problemKey) ? 'bookmarked' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleBookmark(problemId, problemKey);
                }}
              >
                <Bookmark className="bookmark-icon" />
              </button>
            </div>
          );
})}
        </div>
      </div>
    </div>
  );
}

function getRatingColor(rating) {
  if (rating < 1200) return '#43A047';
  if (rating < 1400) return '#7CB342';
  if (rating < 1600) return '#FDD835';
  if (rating < 1900) return '#FB8C00';
  if (rating < 2100) return '#E53935';
  return '#8E24AA';
}

export default ProblemSet;