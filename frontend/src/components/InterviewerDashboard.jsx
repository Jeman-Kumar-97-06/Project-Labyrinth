// frontend/src/components/InterviewerDashboard.jsx
import React, { useState, useEffect } from 'react';

export const InterviewerDashboard = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  
  // Editor State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', cleanCode: '' });

  const fetchChallenges = () => {
    fetch('http://localhost:3000/api/admin/challenges')
      .then(res => res.json())
      .then(data => {
        setChallenges(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  // --- HANDLERS ---

  const handleGenerateLink = (challengeId) => {
    const testUrl = `${window.location.origin}/?problem=${challengeId}`;
    setGeneratedLink(testUrl);
    navigator.clipboard.writeText(testUrl);
  };

  const handleEdit = (challenge) => {
    setEditingId(challenge.id);
    setFormData({ title: challenge.title, description: challenge.description, cleanCode: challenge.cleanCode });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', cleanCode: '' });
  };

  const handleSave = async (id) => {
    const url = id === 'new' 
      ? 'http://localhost:3000/api/admin/challenges' 
      : `http://localhost:3000/api/admin/challenges/${id}`;
    
    const method = id === 'new' ? 'POST' : 'PUT';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    handleCancel();
    fetchChallenges();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this challenge?")) return;
    
    await fetch(`http://localhost:3000/api/admin/challenges/${id}`, { method: 'DELETE' });
    fetchChallenges();
  };

  // --- RENDERERS ---

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading Admin Matrix...</div>;

  return (
    <div style={{ backgroundColor: '#1e1e1e', minHeight: '100vh', padding: '40px', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>Interviewer Control Panel</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Manage tests and generate candidate links.</p>
        </div>
        <button 
          onClick={() => handleEdit({ id: 'new', title: '', description: '', cleanCode: '' })}
          style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Create New Challenge
        </button>
      </div>

      {generatedLink && (
        <div style={{ backgroundColor: '#1b2b1b', border: '1px solid #2a5a2a', padding: '15px', borderRadius: '4px', marginBottom: '30px' }}>
          <strong style={{ color: '#4caf50', display: 'block', marginBottom: '5px' }}>🚀 Candidate Link Copied to Clipboard:</strong>
          <code style={{ color: '#81c784' }}>{generatedLink}</code>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {editingId === 'new' && (
          <ChallengeEditor formData={formData} setFormData={setFormData} onSave={() => handleSave('new')} onCancel={handleCancel} />
        )}

        {challenges.map((challenge) => (
          editingId === challenge.id ? (
            <ChallengeEditor key={challenge.id} formData={formData} setFormData={setFormData} onSave={() => handleSave(challenge.id)} onCancel={handleCancel} />
          ) : (
            <div key={challenge.id} style={{ backgroundColor: '#252526', padding: '20px', borderRadius: '6px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, marginRight: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0e639c' }}>{challenge.title}</h3>
                <p style={{ margin: 0, color: '#aaa', fontSize: '14px', lineHeight: '1.4' }}>{challenge.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleGenerateLink(challenge.id)} style={btnStyle('#0e639c')}>Generate Link</button>
                <button onClick={() => handleEdit(challenge)} style={btnStyle('#555')}>Edit</button>
                <button onClick={() => handleDelete(challenge.id)} style={btnStyle('#d32f2f')}>Delete</button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// Extracted Sub-component for the Edit Form
const ChallengeEditor = ({ formData, setFormData, onSave, onCancel }) => (
  <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '6px', border: '1px dashed #555' }}>
    <input 
      value={formData.title} 
      onChange={e => setFormData({...formData, title: e.target.value})} 
      placeholder="Challenge Title"
      style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
    />
    <textarea 
      value={formData.description} 
      onChange={e => setFormData({...formData, description: e.target.value})} 
      placeholder="Mission Briefing (Description)"
      style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', resize: 'vertical', minHeight: '60px' }}
    />
    <textarea 
      value={formData.cleanCode} 
      onChange={e => setFormData({...formData, cleanCode: e.target.value})} 
      placeholder="Clean Algorithm Code (will be poisoned automatically)"
      style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#111', color: '#4caf50', fontFamily: 'monospace', border: 'none', borderRadius: '4px', resize: 'vertical', minHeight: '150px' }}
    />
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
      <button onClick={onCancel} style={btnStyle('transparent', '#fff', '1px solid #555')}>Cancel</button>
      <button onClick={onSave} style={btnStyle('#4caf50')}>Save Challenge</button>
    </div>
  </div>
);

const btnStyle = (bg, color = 'white', border = 'none') => ({
  padding: '8px 16px', backgroundColor: bg, color, border, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
});