import React, { useState, useEffect, useRef } from 'react';

const commands = {
  help: () => 'Available commands: help, about, clear, echo, time, date',
  about: () => 'Game PC Terminal v1.0.0\nType \'help\' for available commands',
  clear: () => '',
  echo: (args) => args.join(' '),
  time: () => new Date().toLocaleTimeString(),
  date: () => new Date().toLocaleDateString(),
};

export const Terminal = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(['Terminal initialized. Type \'help\' for available commands.']);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const executeCommand = (cmd) => {
    const [command, ...args] = cmd.trim().split(' ');
    const cmdLower = command.toLowerCase();
    
    if (cmdLower === 'clear') {
      setOutput([]);
      return;
    }

    const response = commands[cmdLower] 
      ? commands[cmdLower](args) 
      : `Command not found: ${command}. Type 'help' for available commands.`;
    
    setOutput(prev => [...prev, `$ ${cmd}`, response]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (input.trim() !== '') {
        executeCommand(input);
        setInput('');
      }
    }
  };

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="terminal" style={{
      backgroundColor: '#1e1e1e',
      color: '#33ff33',
      fontFamily: 'monospace',
      padding: '20px',
      height: '100%',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      fontSize: '14px',
      lineHeight: '1.5',
    }}>
      {output.map((line, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>{line}</div>
      ))}
      <div style={{ display: 'flex' }}>
        <span style={{ color: '#33ff33' }}>$&nbsp;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flexGrow: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#33ff33',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
};

export default Terminal;
