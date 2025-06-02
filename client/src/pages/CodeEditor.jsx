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
console.log('API KEY:', apiKey);

function CodeEditor() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const resizeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [problemPanelWidth, setProblemPanelWidth] = useState(40); // percentage
  const [isProblemPanelCollapsed, setIsProblemPanelCollapsed] = useState(false);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('// Write your solution here\n');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');

  const [contestId, problemIndex] = id.match(/^(\d+)([A-Z]\d*)$/).slice(1);
  console.log('Parsed:', contestId, problemIndex);

  // const [scrapedDescription, setScrapedDescription] = useState('');

//   useEffect(() => {
//     axios.get('http://localhost:5000/api/questions')
//       .then(res => {
//         const match = res.data.find(p => p.cfId === id);
//         console.log('Loaded problem:', match); // ✅ Add this
//         setProblem(match);
//       })
//       .catch(err => console.error(err));
//   }, [id]);

// useEffect(() => {
//   if (!problem || !problem.contestId || !problem.problemIndex) return;

//   // Assuming problem.contestID and problem.index are available
//   axios
//     .get(`http://localhost:5000/api/scrapeProblemDescription/${problem.contestID}/${problem.problemIndex}`)
//     .then(res => {
//       console.log('Scraped description:', res.data.description);
//       setScrapedDescription(res.data.description);
//     })
//     .catch(err => {
//       console.error('Failed to fetch scraped description', err);
//       setScrapedDescription('<p>Unable to load problem description</p>');
//     });
// }, [problem]);

  // useEffect(() => {
  //   axios.get('http://localhost:5000/api/questions')
  //     .then(res => {
  //       const match = res.data.find(p => p.cfId === id);
  //       console.log('Matched problem:', match);
  //       if (match) {
  //         setProblem(match);
  //         axios.get(`/api/scrapeProblemDescription/${contestId}/${problemIndex}`)
  //           .then(descRes => {
  //             setProblem(prev => ({ ...prev, description: descRes.data.description }));
  //           }).catch(descErr => console.error("Error fetching scraped description:", descErr));
  //         console.log("Scraped description:", res.data.description);
  //       }
  //     })
  //     .catch(err => console.error("Error fetching question list:", err));
  // }, [id]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/questions/${contestId}/${problemIndex}`);
        console.log("Loaded problem:", res);
        setProblem(res.data);
      } catch (err) {
        console.error('Error fetching problem details:', err);
        setProblem({ title: 'Error', description: 'Could not load problem.', sampleInput: '', sampleOutput: '' });
      }
    };

    fetchProblemData();
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // if (!problem) return <div>Loading...</div>;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const containerWidth = document.querySelector('.editor-container').offsetWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      setProblemPanelWidth(Math.min(Math.max(newWidth, 20), 80));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
        await axios.post(`http://localhost:5000/api/users/${currentUser.id}/submit`, {
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

//   return (
//     <div className="code-editor-page">
//       <Navbar />
//       <div className="editor-container">
//         <div className="problem-panel" style={{ width: `${problemPanelWidth}%` }}>
//           <h1 className="problem-title">{problem.title}</h1>
//           <div className="problem-description" dangerouslySetInnerHTML={{ __html: scrapedDescription || problem.description || 'No description available' }}>
//             {/* <h3>Description</h3>
//             <pre>{problem.description || 'No description available'}</pre>
//             <h3>Tags</h3>
//             <pre>{problem.tags.join(', ')}</pre>
//             <h4>Sample Input</h4>
//             <pre>{problem.sampleInput || 'N/A'}</pre>
//             <h4>Sample Output</h4>
//             <pre>{problem.sampleOutput || 'N/A'}</pre> */}
          
//           </div>
//         </div>

//         {/* Divider for resizing */}
//         <div
//           className="resizer"
//           ref={resizeRef}
//           onMouseDown={() => setIsResizing(true)}
//         />

//         <div className="editor-panel">
//           <div className="editor-controls">
//             <select value={language} onChange={handleLanguageChange} className="language-select">
//               {Object.entries(languageOptions).map(([key, opt]) => (
//                 <option key={key} value={key}>{opt.label}</option>
//               ))}
//             </select>
//             <button onClick={handleSubmit} className="btn btn-primary">Run Code</button>
//           </div>

//           <Editor
//             height="50vh"
//             language={language}
//             value={code}
//             onChange={setCode}
//             theme="vs-dark"
//             onMount={handleEditorDidMount}
//             options={{
//               minimap: { enabled: false },
//               fontSize: 14,
//               lineNumbers: 'on',
//               automaticLayout: true,
//               scrollBeyondLastLine: false,
//             }}
//           />

//           {status && (
//             <div className={`submission-status ${status.toLowerCase().replace(' ', '-')}`}>
//               {status}
//             </div>
//           )}

//           {output && (
//             <div className="output-panel">
//               <h3>Output:</h3>
//               <pre>{output}</pre>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CodeEditor;

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

        <div className="editor-panel" style={{ flex: 1 }}>
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

          <div className="output-panel">
            <h3>Status: {status}</h3>
            {output && (
              <>
                <h3>Output:</h3>
                <pre>{output}</pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;