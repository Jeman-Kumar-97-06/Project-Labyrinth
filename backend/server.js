const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { poisonCode } = require('./poisoner');
const { analyzeSubmission } = require('./analyzer');
const { runPolyglotTests } = require('./executor');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: 'https://bright-khapse-2658ea.netlify.app/', // Put your exact Netlify URL here
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
app.use(express.json());

const DB_PATH = path.join(__dirname, 'challenges.json');

// Helper function to read the DB
async function readDB() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write to the DB
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- PUBLIC ROUTES (For the Interviewee) ---

app.get('/api/challenge', async (req, res) => {
  try {
    const challenges = await readDB();
    const targetId = req.query.id || challenges[0].id; 
    const selectedChallenge = challenges.find(c => c.id === targetId);

    if (!selectedChallenge) return res.status(404).json({ error: "Challenge not found" });

    const poisonedCode = poisonCode(selectedChallenge.cleanCode);
    
    const fileTree = [
      { id: 'root_1', type: 'folder', name: 'src', children: [
        { id: 'folder_1', type: 'folder', name: 'legacy_wrappers', children: [
          { id: 'file_1', type: 'file', name: 'auth_matrix.js', content: '// Deprecated' },
          { id: 'file_2', type: 'file', name: 'target_module.js', content: poisonedCode }
        ]}
      ]},
      { id: 'file_3', type: 'file', name: 'config.json', content: '{\n  "legacyMode": true\n}' }
    ];
    
    res.json({
      id: selectedChallenge.id,
      title: selectedChallenge.title,
      description: selectedChallenge.description,
      fileSystem: fileTree,
      targetFileId: 'file_2'
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/submit', async (req, res) => {
  const { challengeId, ledger, finalCode, language } = req.body;
  
  if (!ledger || !finalCode || !challengeId || !language) {
    return res.status(400).json({ error: "Missing submission data" });
  }

  try {
    const challenges = await readDB();
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return res.status(404).json({ error: "Challenge not found" });

    // 1. Run Anti-Cheat
    const analysisResult = analyzeSubmission(ledger, finalCode);

    // 2. Run Polyglot Execution
    const testResults = await runPolyglotTests(finalCode, targetChallenge.tests || [], language);

    // Handle API failures gracefully
    if (testResults.error) {
      return res.status(500).json({ error: testResults.error });
    }

    res.json({
      antiCheat: analysisResult,
      execution: testResults,
      finalVerdict: (testResults.passed === testResults.totalTests && analysisResult.trustScore >= 70) 
        ? 'HIRE - Clean Code & Organic Behavior' 
        : 'REJECT - Failed Tests or AI Flagged'
    });

  } catch (error) {
    res.status(500).json({ error: "Server execution failed" });
  }
});

// --- ADMIN ROUTES (For the Interviewer) ---

// GET all challenges (Full data for admin editing)
app.get('/api/admin/challenges', async (req, res) => {
  try {
    const challenges = await readDB();
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// CREATE a new challenge
app.post('/api/admin/challenges', async (req, res) => {
  try {
    const challenges = await readDB();
    const newChallenge = {
      id: `task_${Date.now()}`, // Generate a unique ID
      title: req.body.title || 'New Challenge',
      description: req.body.description || 'Description here.',
      cleanCode: req.body.cleanCode || 'function solve() {}'
    };
    challenges.push(newChallenge);
    await writeDB(challenges);
    res.json(newChallenge);
  } catch (err) {
    res.status(500).json({ error: "Failed to save challenge" });
  }
});

// UPDATE an existing challenge
app.put('/api/admin/challenges/:id', async (req, res) => {
  try {
    const challenges = await readDB();
    const index = challenges.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    challenges[index] = { ...challenges[index], ...req.body };
    await writeDB(challenges);
    res.json(challenges[index]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

// DELETE a challenge
app.delete('/api/admin/challenges/:id', async (req, res) => {
  try {
    let challenges = await readDB();
    challenges = challenges.filter(c => c.id !== req.params.id);
    await writeDB(challenges);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete challenge" });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));