// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import axios from 'axios';
const baseURL = import.meta.env.VITE_BACKEND_URL; // For Vite

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export default function AuthContextProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (rawUser && rawUser !== 'undefined' && token) {
        const user = JSON.parse(rawUser);
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Failed to parse user from localStorage', err);
      localStorage.removeItem('user'); // prevent future crashes
    }
  }, []);


  const login = async (username, password) => {
    const res = await axios.post(`${baseURL}/api/auth/login`, { username, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setCurrentUser(res.data.user);
  };

  const signup = async (email, password, username) => {
    const res = await axios.post(`${baseURL}/api/auth/signup`, { email, password, username });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setCurrentUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const loginWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    const res = await axios.post(`${baseURL}/api/auth/google`, { idToken });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setCurrentUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
