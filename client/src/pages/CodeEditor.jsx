import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import '../styles/global.css';
import '../styles/dashboard.css';
const baseURL = import.meta.env.VITE_API_BASE_URL; // For Vite

const languageOptions = {
  c: { id: 103, label: 'C' },
  cpp: { id: 105, label: 'C++' },
  python: { id: 71, label: 'Python' },
  java: { id: 62, label: 'Java' },
  javascript: { id: 63, label: 'JavaScript' }
};

const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
console.log('API KEY:', apiKey);

function CodeEditor() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const resizeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [problemPanelWidth, setProblemPanelWidth] = useState(40); // percentage
  const [isProblemPanelCollapsed, setIsProblemPanelCollapsed] = useState(false);

  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('// Write your solution here\n');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');

  const isContestFormat = /^(\d+)([A-Z]\d*)$/.test(id);
  let contestId = null;
  let problemIndex = null;

  if (isContestFormat) {
    const match = id.match(/^(\d+)([A-Z]\d*)$/);
    contestId = match[1];
    problemIndex = match[2];
  }

  console.log('Parsed:', contestId, problemIndex);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  useEffect(() => {
    const fetch = async () => {
      const user = JSON.parse(localStorage.getItem("user")) || currentUser;
      console.log(1);

      // Case 1: submissionId route
      if (!contestId || !problemIndex) {
        try {
          const res = await axios.get(`${baseURL}/api/solutions/${id}?userId=${user.id}`);
          const submission = res.data;
          console.log(submission);

          // Load problem from DB
          const problemId = submission.problemId;
          console.log(problemId);
          const problemRes = await axios.get(`${baseURL}/api/questions/${problemId}`);
          setProblem(problemRes.data);

          setCode(submission.solutionCode);
          setLanguage(submission.language || 'cpp');
          setStatus(submission.status);
        } catch (err) {
          console.error('Failed to load submission:', err);
          setProblem({ title: 'Error', description: 'Submission not found.', sampleInput: '', sampleOutput: '' });
        }
      }
      // Case 2: normal editor route with contestId + problemIndex
      else {
        try {
          const res = await axios.get(`${baseURL}/api/questions/${contestId}/${problemIndex}`);
          setProblem(res.data);
          setCode('// Write your solution here\n');
        } catch (err) {
          console.error('Error fetching problem details:', err);
          setProblem({ title: 'Error', description: 'Could not load problem.', sampleInput: '', sampleOutput: '' });
        }
      }
    };

    fetch();
  }, [id]);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSubmit = async () => {
    console.log("API KEY:", apiKey);

    setStatus('Submitting...');
    setOutput('');

    const encodedSourceCode = btoa(code);
    const encodedStdin = btoa(problem.sampleInput || '');

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
    setStatus('Evaluating...');

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

        if (result.data.status.id <= 2) return; // In Queue or Processing

        clearInterval(interval);
        // setStatus(result.data.status.description);
        const outputText = atob(result.data.stdout || '').trim();
        const expectedOutput = (problem.sampleOutput || '').trim();
        const isCorrect = outputText === expectedOutput

        if (isCorrect) {
          setStatus('Accepted ✅');
        } else {
          setStatus('Wrong Answer ❌');
        }

        setOutput(outputText || 'No output');

        // ✅ Save the submission
        await axios.post(`${baseURL}/api/users/${currentUser.id}/submit`, {
          problemId: problem._id,
          solutionCode: code,
          isCorrect
        });

      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
        setStatus('Error fetching result');
      }
    }, 2000);
  };

  if (!problem) return <div>Loading...</div>;

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
      <br></br>
      <div className="editor-container" style={{ display: 'flex', gap: '24px', padding: '1rem' }}>
        <div className="problem-panel" style={{ flex: 1, maxWidth: '50%' }}>
          <h1>{problem.header || problem.title}</h1>
          <div className="problem-description" style={{ lineHeight: '1.6', fontSize: '14px' }}>
            <h3>Description</h3>
            {problem.description ? (
              problem.description
                .split('\n')
                .map((line, index) => {
                  const cleaned = line.trim().replace(/\s+/g, ' '); // 🧼 remove extra spaces
                  return cleaned ? <p key={index} style={{ marginBottom: '10px' }}>{cleaned}</p> : null;
                })
            ) : (
              <p>No description available.</p>
            )}

            <h4>Sample Input</h4>
            {problem.sampleInput ? (
              problem.sampleInput
                .split('\n')
                .map((line, index) => {
                  const cleaned = line.trim().replace(/\s+/g, ' '); // 🧼 remove extra spaces
                  return cleaned ? <p key={index} style={{ marginBottom: '10px' }}>{cleaned}</p> : null;
                })
            ) : (
              <p>No description available.</p>
            )}

            <h4>Sample Output</h4>
            {problem.sampleOutput ? (
              problem.sampleOutput
                .split('\n')
                .map((line, index) => {
                  const cleaned = line.trim().replace(/\s+/g, ' '); // 🧼 remove extra spaces
                  return cleaned ? <p key={index} style={{ marginBottom: '10px' }}>{cleaned}</p> : null;
                })
            ) : (
              <p>No description available.</p>
            )}
          </div>
        </div>

        <div className="editor-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="editor-controls" style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <select value={language} onChange={handleLanguageChange}>
              {Object.entries(languageOptions).map(([key, opt]) => (
                <option key={key} value={key}>{opt.label}</option>
              ))}
            </select>
            <button onClick={handleSubmit} className="btn btn-primary">Run Code</button>
          </div>

          <Editor
            height="60vh"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={setCode}
          />

          <div className="output-panel" style={{
            padding: '1rem',
            maxHeight: 'calc(100vh - 300px)',
            overflowY: 'auto',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}>
            <h3>Status: {status}</h3>
            {output && (
              <>
                <h3>Output:</h3>
                <pre style={{
                  background: '#111',
                  color: '#0f0',
                  padding: '10px',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {output}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;