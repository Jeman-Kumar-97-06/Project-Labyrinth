// frontend/src/components/LabyrinthEditor.jsx
import React, { useRef } from 'react';
import { useTrackerStore } from '../store/useTrackerStore';

export const LabyrinthEditor = () => {
  const { logEvent, activeFile, updateActiveFileContent } = useTrackerStore();
  const editorRef = useRef(null);

  // If no file is selected, show a blank state
  if (!activeFile) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', backgroundColor: '#1e1e1e' }}>
        Select a file from the explorer to begin.
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      logEvent('DELETE', { key: e.key, cursor: editorRef.current.selectionStart });
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      logEvent('PASTE_ATTEMPT', { cursor: editorRef.current.selectionStart });
      return;
    }
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt'];
    if (!ignoredKeys.includes(e.key)) {
      logEvent('KEYSTROKE', { key: e.key });
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('Text');
    logEvent('PASTE_EXECUTE', { length: pastedData.length });
  };

  const handleChange = (e) => {
    updateActiveFileContent(e.target.value);
  };

  return (
    <textarea 
      ref={editorRef}
      key={activeFile.id} // Force re-render when file changes
      defaultValue={activeFile.content}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style={{ width: '100%', height: '100%', backgroundColor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '14px', padding: '20px', border: 'none', outline: 'none', resize: 'none' }}
      spellCheck="false"
    />
  );
};