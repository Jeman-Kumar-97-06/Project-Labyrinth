// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { LabyrinthEditor } from './components/LabyrinthEditor';
import { FileExplorer } from './components/FileExplorer';
import { InterviewerDashboard } from './components/InterviewerDashboard';
import { LandingPage } from './components/LandingPage';
import { useTrackerStore } from './store/useTrackerStore';

// --- THE IDE WORKSPACE WRAPPER ---
const ChallengeWorkspace = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  
  const { startTracking, getLedger, activeFile, logEvent } = useTrackerStore();

  // 1. Initial Challenge Fetch
  useEffect(() => {
    fetch(`https://project-labyrinth.onrender.com/api/challenge?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Challenge not found");
        return res.json();
      })
      .then(data => {
        setChallenge(data);
        startTracking();
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        navigate('/'); // Kick to home if invalid link
      });
  }, [id, startTracking, navigate]);

  // 2. Cognitive Telemetry (Window Focus & Snapshots)
  useEffect(() => {
    if (loading) return; // Don't start timers until the workspace is ready

    const handleBlur = () => logEvent('WINDOW_BLUR', { reason: 'Lost Focus' });
    const handleFocus = () => logEvent('WINDOW_FOCUS', { reason: 'Gained Focus' });

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const snapshotInterval = setInterval(() => {
      if (activeFile) {
        logEvent('CODE_SNAPSHOT', { 
          length: activeFile.content.length,
          content: activeFile.content 
        });
      }
    }, 10000);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      clearInterval(snapshotInterval);
    };
  }, [loading, logEvent, activeFile]);

  // 3. Submission Handler
  const handleSubmit = async () => {
    const behavioralLedger = getLedger();
    const finalCode = activeFile ? activeFile.content : "";

    try {
      const response = await fetch('https://project-labyrinth.onrender.com/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          challengeId: challenge.id, 
          ledger: behavioralLedger, 
          finalCode, 
          language: selectedLanguage
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert(`Execution Error: ${result.error}`);
        return;
      }

      // Detailed feedback alert
      let message = `--- VERDICT ---\n${result.finalVerdict}\n\n`;
      message += `--- ANTI-CHEAT ---\nTrust Score: ${result.antiCheat.trustScore}/100\n`;
      if (result.antiCheat.flags.length > 0) {
        message += `Flags: ${result.antiCheat.flags.join(', ')}\n`;
      }
      message += `\n--- EXECUTION ---\nTests Passed: ${result.execution.passed} / ${result.execution.totalTests}\n`;
      
      alert(message);
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>Loading System Node...</div>;

  return (
    <div style={{ backgroundColor: '#1e1e1e', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar with Polyglot Selector */}
      <div style={{ padding: '10px 20px', backgroundColor: '#333333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '16px', fontFamily: 'sans-serif' }}>{challenge.title}</h2>
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ padding: '4px 8px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #555', borderRadius: '4px', outline: 'none' }}
          >
            <option value="javascript">JavaScript (Node)</option>
            <option value="python">Python 3</option>
            <option value="c">C (GCC)</option>
          </select>
        </div>
        <button onClick={handleSubmit} style={{ padding: '6px 12px', backgroundColor: '#0e639c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Run Tests & Submit
        </button>
      </div>

      {/* Main Workspace Split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FileExplorer fileSystem={challenge.fileSystem} />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '15px 20px', borderBottom: '1px solid #333', borderLeft: '4px solid #0e639c', fontFamily: 'sans-serif' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '14px' }}>Mission Briefing</h3>
            <p style={{ margin: 0, color: '#ccc', fontSize: '14px', lineHeight: '1.5' }}>{challenge.description}</p>
          </div>
          
          <div style={{ backgroundColor: '#2d2d2d', padding: '10px 20px', color: '#888', fontSize: '13px', borderBottom: '1px solid #1e1e1e', fontFamily: 'monospace' }}>
            {activeFile ? activeFile.name : 'Workspace Ready'}
          </div>
          
          {/* Using LabyrinthEditor to maintain keystroke/paste tracking */}
          <LabyrinthEditor />
        </div>
      </div>

    </div>
  );
};

// --- THE MAIN APP ROUTER ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<InterviewerDashboard />} />
        <Route path="/challenge/:id" element={<ChallengeWorkspace />} />
      </Routes>
    </Router>
  );
}

export default App;