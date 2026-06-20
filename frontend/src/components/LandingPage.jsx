// frontend/src/components/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. Import the routing hook

export const LandingPage = () => {
  const [showStudentInput, setShowStudentInput] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  
  // 2. Initialize the hook
  const navigate = useNavigate();

  const handleAdminClick = () => {
    // 3. Use clean React Router navigation instead of window.location
    navigate('/admin'); 
  };

  const handleJoinChallenge = () => {
    if (!inviteLink.trim()) return;

    // Clean up the input whether they paste the full URL or just the ID
    let targetPath = inviteLink;
    if (inviteLink.includes('/challenge/')) {
      const parts = inviteLink.split('/challenge/');
      targetPath = `/challenge/${parts[1]}`;
    } else if (!inviteLink.startsWith('/')) {
      targetPath = `/challenge/${inviteLink}`;
    }

    // 4. Navigate the student to the workspace
    navigate(targetPath); 
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', letterSpacing: '2px' }}>LABYRINTH</h1>
        <p style={{ color: '#888', margin: 0, fontSize: '16px' }}>Cognitive Assessment & Anti-Cheat Environment</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button 
          onClick={handleAdminClick}
          style={btnStyle('#2d2d2d', '#fff', '1px solid #444')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d2d2d'}
        >
          🔑 Admin Login
        </button>
        
        <button 
          onClick={() => setShowStudentInput(!showStudentInput)}
          style={btnStyle('#0e639c', '#fff', 'none')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1177bb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0e639c'}
        >
          💻 Interviewee / Student
        </button>
      </div>

      {showStudentInput && (
        <div style={{
          backgroundColor: '#252526',
          padding: '20px',
          borderRadius: '6px',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#ccc', fontSize: '14px' }}>Paste your mission invite link below:</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="e.g. seq_01 or full URL" 
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinChallenge()}
              style={{
                padding: '10px 15px',
                width: '300px',
                backgroundColor: '#111',
                border: '1px solid #444',
                color: '#4caf50',
                borderRadius: '4px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleJoinChallenge}
              style={btnStyle('#4caf50', '#fff', 'none')}
            >
              Enter
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const btnStyle = (bg, color, border) => ({
  padding: '12px 24px',
  backgroundColor: bg,
  color: color,
  border: border,
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '16px',
  transition: 'background-color 0.2s'
});