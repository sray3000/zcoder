import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, BookMarked, Code2, Trophy } from 'lucide-react';
import axios from 'axios';
import '../styles/dashboard.css';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userStats, setUserStats] = useState({
    problemsSolved: 0,
    submissions: 0,
    successRate: 0,
    bookmarkedProblems: [],
    solutions: [],
    activityData: []
  });

  useEffect(() => {
    if (currentUser) {
      // Fetch user statistics and data
      console.log(currentUser);
      Promise.all([
        axios.get(`http://localhost:5000/api/users/${currentUser.id}/stats`),
        axios.get(`http://localhost:5000/api/users/${currentUser.id}/bookmarks`),
        axios.get(`http://localhost:5000/api/users/${currentUser.id}/solutions`),
        axios.get(`http://localhost:5000/api/users/${currentUser.id}/activity`)
      ]).then(([stats, bookmarks, solutions, activity]) => {
        setUserStats({
          problemsSolved: stats.data.solved,
          submissions: stats.data.submissions,
          successRate: stats.data.successRate,
          bookmarkedProblems: bookmarks.data,
          solutions: solutions.data,
          activityData: activity.data
        });
      }).catch(error => console.error('Error fetching user data:', error));
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

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
            <button className="btn btn-outline" onClick={() => window.location.href = '/problems'}>Go to Problemset</button>
            <button className="btn btn-outline" onClick={() => window.location.href = '/editor'}>Go to Code Editor</button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="container">
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-info">
                <h2>{currentUser?.username}'s Profile</h2>
                <p className="profile-stats">
                  <Trophy className="inline-icon" /> Rank: {userStats.problemsSolved > 100 ? 'Expert' : 
                    userStats.problemsSolved > 50 ? 'Intermediate' : 'Beginner'}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-section">
              <h2><Code2 className="section-icon" /> Recent Submissions</h2>
              <div className="solutions-list">
                {userStats.solutions.slice(0, 5).map(solution => (
                  <Link
                    key={solution.id || solution.submissionId}
                    to={`/editor/${solution.id || solution.submissionId}`}
                    className="solution-item"
                    style={{
                      borderLeft: `5px solid ${getStatusColor(solution.status)}`
                    }}
                  >
                    <span className="solution-title">{solution.problemTitle}</span>
                    <span className="solution-date">{new Date(solution.submittedAt || solution.timestamp).toLocaleDateString()}</span>
                    <span
                      className="solution-status"
                      style={{ color: getStatusColor(solution.status), fontWeight: 'bold' }}
                    >
                      {solution.status || 'Unknown'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h2><BookMarked className="section-icon" /> Bookmarked Problems</h2>
              <div className="bookmarks-list">
                {userStats.bookmarkedProblems.map(problem => (
                  <Link key={problem.id} to={`/editor/${problem.contestId}${problem.problemIndex}`} className="bookmark-item">
                    <span className="problem-title">{problem.title}</span>
                    <span className="problem-difficulty" style={{ 
                      backgroundColor: getRatingColor(problem.rating)
                    }}>{problem.rating}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h2><Calendar className="section-icon" /> Activity Calendar</h2>
            <div className="activity-grid">
              {userStats.activityData.map((day, index) => (
                <div 
                  key={index}
                  className="activity-cell"
                  style={{
                    backgroundColor: getActivityColor(day.submissions)
                  }}
                  title={`${day.date}: ${day.submissions} submissions`}
                />
              ))}
            </div>
          </div>

          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Problems Solved</h3>
                <p className="stat-number">{userStats.problemsSolved}</p>
              </div>
              <div className="stat-card">
                <h3>Total Submissions</h3>
                <p className="stat-number">{userStats.submissions}</p>
              </div>
              <div className="stat-card">
                <h3>Success Rate</h3>
                <p className="stat-number">{userStats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
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

function getActivityColor(submissions) {
  if (submissions === 0) return '#ebedf0';
  if (submissions < 3) return '#9be9a8';
  if (submissions < 6) return '#40c463';
  if (submissions < 9) return '#30a14e';
  return '#216e39';
}

function getStatusColor(status) {
  if (!status || typeof status !== 'string') return '#607D8B'; // fallback color

  switch (status.toLowerCase()) {
    case 'accepted':
      return '#4CAF50'; // green
    case 'wrong answer':
      return '#F44336'; // red
    default:
      return '#607D8B'; // default gray-blue
  }
}

export default Dashboard;