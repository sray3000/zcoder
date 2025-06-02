import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

function EditorPage() {
  const { solutionId } = useParams();
  const [solution, setSolution] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')); // or use context
    axios.get(`http://localhost:5000/api/solutions/${solutionId}?userId=${user.id}`)
      .then(res => setSolution(res.data))
      .catch(err => console.error('Error loading solution:', err));
  }, [solutionId]);

  if (!solution) return <div>Loading...</div>;

  return (
    <div>
      <h2>{solution.problemTitle} ({solution.contestId}{solution.problemIndex})</h2>
      <p>Language: {solution.language}</p>
      <pre style={{ background: '#eee', padding: '1rem' }}>{solution.code}</pre>
    </div>
  );
}

export default EditorPage;
