import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import '../styles/global.css';
import '../styles/dashboard.css';

const languageOptions = {
  c: { id: 103, label: 'C' },
  cpp: { id: 105, label: 'C++' },
  python: { id: 71, label: 'Python' },
  java: { id: 62, label: 'Java' },
  javascript: { id: 63, label: 'JavaScript' }
};

const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;

function CodeEditor() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('// Write your code here\n');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSubmit = async () => {
    setOutput('');

    const encodedSourceCode = btoa(code);
    const encodedStdin = btoa(input || '');

    try {
      const submissionRes = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false',
        {
          source_code: encodedSourceCode,
          language_id: languageOptions[language].id,
          stdin: encodedStdin
        },
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
          }
        }
      );

      const token = submissionRes.data.token;
      pollResult(token);
    } catch (error) {
      setStatus('Submission failed');
      console.error(error);
    }
  };

  const pollResult = async (token) => {
    setStatus('Running your code...');

    const interval = setInterval(async () => {
      try {
        const result = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
          {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
          }
        );

        if (result.data.status.id <= 2) return;

        clearInterval(interval);
        const outputText = atob(result.data.stdout || '').trim();
        const errorText = atob(result.data.stderr || '').trim();
        const compileOutput = atob(result.data.compile_output || '').trim();

        if(result.data.status.description == "Compilation Error")
          setStatus("Compilation Error");
        else
          setStatus("Code executed successfully!!");
        setOutput(outputText || errorText || compileOutput || 'No output');
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
        setStatus('Error fetching result');
      }
    }, 2000);
  };

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
            <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
            <button className="btn btn-outline" onClick={() => window.location.href = '/problems'}>Go to Problemset</button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
        {/* Code Editor */}
        <div style={{ flex: 1, borderRight: '1px solid #ccc', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <select value={language} onChange={handleLanguageChange}>
              {Object.entries(languageOptions).map(([key, opt]) => (
                <option key={key} value={key}>{opt.label}</option>
              ))}
            </select>
            <button onClick={handleSubmit} className="btn btn-primary">Run Code</button>
          </div>
          <Editor
            height="75vh"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={setCode}
          />
        </div>

        {/* Output Panel */}
        <div style={{ flex: 1, padding: '1rem' }}>
          <h3>Custom Input</h3>
          <textarea
            style={{ width: '100%', height: '100px', marginBottom: '10px' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter custom input here..."
          />

          <h3>Status: {status}</h3>

          <h3>Output:</h3>
          <pre style={{ background: '#111', color: '#0f0', padding: '10px', minHeight: '200px' }}>
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
