// backend/analyzer.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Helper: Counts how many structural logic nodes exist in a code string
function getAstNodeCount(codeString) {
  try {
    const ast = parser.parse(codeString, { 
      sourceType: 'module',
      plugins: ['jsx'] // In case we test React code later
    });
    
    let nodeCount = 0;
    traverse(ast, {
      enter() { nodeCount++; } // Count every single structural element
    });
    
    return nodeCount;
  } catch (error) {
    // If the code is currently broken/incomplete (which is normal during human typing), 
    // we can't build a perfect AST. We return -1 to indicate an "in-progress" state.
    return -1; 
  }
}

function analyzeSubmission(ledger, finalCode) {
  let score = 100;
  const flags = [];

  const blurEvents = ledger.filter(e => e.type === 'WINDOW_BLUR');
  const focusEvents = ledger.filter(e => e.type === 'WINDOW_FOCUS');
  const snapshots = ledger.filter(e => e.type === 'CODE_SNAPSHOT');
  const pastes = ledger.filter(e => e.type === 'PASTE_EXECUTE');

  // --- METRIC 1: The Tab-Switch Correlator ---
  let totalTimeAway = 0;
  for (let i = 0; i < blurEvents.length; i++) {
    const blurTime = blurEvents[i].timeSinceStart;
    // Find the next focus event
    const nextFocus = focusEvents.find(f => f.timeSinceStart > blurTime);
    if (nextFocus) {
      totalTimeAway += (nextFocus.timeSinceStart - blurTime);
    }
  }

  if (totalTimeAway > 30000) { // Spent more than 30 seconds off-screen
    score -= 30;
    flags.push(`Suspicious Focus Loss: Candidate left the testing tab for ${Math.round(totalTimeAway / 1000)} total seconds.`);
  }

  // --- METRIC 2: The "Structural Teleportation" Trap ---
  // Compare sequential snapshots to see how fast the logic grew
  let maxAstJump = 0;
  
  for (let i = 1; i < snapshots.length; i++) {
    const prevCount = getAstNodeCount(snapshots[i-1].content);
    const currCount = getAstNodeCount(snapshots[i].content);
    
    // Only compare valid, parsable states
    if (prevCount !== -1 && currCount !== -1) {
      const nodeDelta = currCount - prevCount;
      if (nodeDelta > maxAstJump) maxAstJump = nodeDelta;
      
      // If they generate more than 40 logic nodes in a 10 second window, it's non-human
      if (nodeDelta > 40) {
        score -= 50;
        flags.push(`AST Velocity Anomaly: Added ${nodeDelta} structural nodes in < 10 seconds.`);
      }
    }
  }

  // --- METRIC 3: The "Human Printer" Trap ---
  // If they type perfectly from top to bottom with zero structural backtracking
  const deletions = ledger.filter(e => e.type === 'DELETE');
  if (snapshots.length > 3 && deletions.length === 0 && maxAstJump > 5) {
    score -= 20;
    flags.push("Linear Execution Anomaly: Code evolved cleanly with zero backspaces or structural backtracking.");
  }

  // --- METRIC 4: Raw Paste Volume ---
  const totalPasted = pastes.reduce((sum, p) => sum + (p.length || 0), 0);
  if (totalPasted > 100) {
    score -= 40;
    flags.push(`Massive Paste Detected: ${totalPasted} characters injected.`);
  }

  score = Math.max(0, score);

  return {
    trustScore: score,
    verdict: score >= 70 ? 'Organic' : 'Highly Suspicious (Likely AI)',
    flags,
    metrics: { maxAstJump, totalTimeAwayMs: totalTimeAway }
  };
}

module.exports = { analyzeSubmission, getAstNodeCount };