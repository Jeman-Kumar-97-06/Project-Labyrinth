// frontend/src/components/FileExplorer.jsx
import React, { useState } from 'react';
import { useTrackerStore } from '../store/useTrackerStore';

// Recursive node component for the tree
const FileNode = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);
  const setActiveFile = useTrackerStore((state) => state.setActiveFile);
  const activeFile = useTrackerStore((state) => state.activeFile);

  const isFolder = node.type === 'folder';
  const isSelected = activeFile?.id === node.id;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      setActiveFile(node);
    }
  };

  return (
    <div style={{ paddingLeft: '15px', color: '#ccc', fontFamily: 'monospace', fontSize: '14px' }}>
      <div 
        onClick={handleClick}
        style={{ 
          cursor: 'pointer', 
          padding: '4px 8px',
          backgroundColor: isSelected ? '#37373d' : 'transparent',
          color: isSelected ? '#fff' : '#ccc',
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#37373d' : '#2a2d2e'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#37373d' : 'transparent'}
      >
        <span style={{ marginRight: '6px', fontSize: '12px' }}>
          {isFolder ? (isOpen ? '📂' : '📁') : '📄'}
        </span>
        {node.name}
      </div>
      
      {/* Recursively render children if it's an open folder */}
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer = ({ fileSystem }) => {
  return (
    <div style={{ 
      width: '250px', 
      minWidth: '250px',
      backgroundColor: '#252526', 
      borderRight: '1px solid #333',
      padding: '10px 0',
      overflowY: 'auto'
    }}>
      <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>
        Project Files
      </div>
      {fileSystem.map(node => (
        <FileNode key={node.id} node={node} />
      ))}
    </div>
  );
};