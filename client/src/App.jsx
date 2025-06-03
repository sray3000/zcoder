import { useAuth } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { initializeApp } from 'firebase/app';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProblemSet from './pages/ProblemSet';
import CodeEditor from './pages/CodeEditor';
import AuthContextProvider from './contexts/AuthContext';
import './styles/reset.css';
import './styles/global.css';

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "your-app.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-app.appspot.com",
//   messagingSenderId: "your-messaging-sender-id",
//   appId: "your-app-id"
// };

// // Initialize Firebase
// initializeApp(firebaseConfig);

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/problems" element={<ProblemSet />} />
      <Route path="/editor/" element={<CodeEditor />} />
      <Route path="/editor/:id" element={<CodeEditor />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthContextProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthContextProvider>
  );
}

export default App;