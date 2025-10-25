import React, { useState, useEffect, useRef } from 'react';

// File system simulation
const files = {
  'riddle.txt': 'What has keys but no locks, space but no room, and you can enter but not go in?',
  'words.txt': 'apple\nbanana\ncherry\ndate\nelderberry\nfig\ngrape\nhoneydew\nkiwi\nlemon\nmango\nnectarine\norange\npear\nquince\nraspberry\nstrawberry\ntangerine\nugli\nvanilla\nwatermelon\nxigua\nyuzu\nzucchini',
  'live.txt': '01010100 01101000 01101001 01110011 00100000 01101001 01110011 00100000 01101010 01110101 01110011 01110100 00100000 01110011 01101111 01101101 01100101 00100000 01110010 01100001 01101110 01100100 01101111 01101101 00100000 01101010 01101001 01100010 01100010 01100101 01110010 01101001 01110011 01101000 00100000 01110100 01100101 01111000 01110100 00100000 00111010 00101001'
};

// Format words.txt with line numbers
const formatWithLineNumbers = (text) => {
  return text.split('\n').map((line, i) => `${(i + 1).toString().padStart(2, ' ')} ${line}`).join('\n');
};

const commands = {
  help: () => 'Available commands: help, clear, ls, cat <filename>',
  clear: () => '',
  ls: () => Object.keys(files).join('  '),
  cat: (args) => {
    if (args.length === 0) return 'Usage: cat <filename>';
    const filename = args[0];
    if (!files[filename]) return `cat: ${filename}: No such file or directory`;
    
    if (filename === 'words.txt') {
      return formatWithLineNumbers(files[filename]);
    }
    
    return files[filename];
  },
  // Add a command to make the riddle more interactive
  answer: (args) => {
    if (args[0]?.toLowerCase() === 'keyboard') {
      return 'Correct! The answer is indeed a keyboard!';
    }
    return 'Try guessing the answer to the riddle. Use: answer <your answer>';
  }
};

export const Terminal = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([{ text: 'Terminal initialized. Type \'help\' for available commands.', type: 'output' }]);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const executeCommand = (cmd) => {
    const [command, ...args] = cmd.trim().split(' ');
    const cmdLower = command.toLowerCase();
    
    if (cmdLower === 'clear') {
      setOutput([]);
      return;
    }

    let response;
    if (commands[cmdLower]) {
      response = commands[cmdLower](args);
    } else {
      response = `Command not found: ${command}. Type 'help' for available commands.`;
    }
    
    setOutput(prev => [...prev, 
      { text: `$ ${cmd}`, type: 'command' },
      { text: response, type: 'output' }
    ]);
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
      endRef.current.scrollIntoView();
    }
  }, [output]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const renderLine = (item, i) => {
    if (item.type === 'command') {
      return (
        <div key={i} style={{ color: '#33ff33', marginBottom: '4px' }}>
          {item.text}
        </div>
      );
    }
    
    // For file content with line numbers (words.txt)
    if (item.text.includes('1  apple')) {
      return (
        <pre key={i} style={{ 
          color: '#33ff33', 
          margin: '4px 0',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '24px'
        }}>
          {item.text}
        </pre>
      );
    }
    
    return (
      <div key={i} style={{ 
        color: '#33ff33', 
        marginBottom: '6px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '24px'
      }}>
        {item.text}
      </div>
    );
  };

  return (
    <div className="terminal" style={{
      backgroundColor: '#0a0a0a',
      color: '#33ff33',
      fontFamily: 'monospace',
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      scrollbarWidth: 'none',  /* Firefox */
      msOverflowStyle: 'none',  /* IE and Edge */
      '&::-webkit-scrollbar': {
        display: 'none',  /* Chrome, Safari, Opera */
      },
      WebkitOverflowScrolling: 'touch',
      fontSize: '24px',
      lineHeight: '1.5',
    }}>
      {output.map((item, i) => renderLine(item, i))}
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
            fontSize: '24px',
            caretColor: '#33ff33',
            height: '24px',
          }}
          placeholder="Type 'help' for commands"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
};

export default Terminal;
