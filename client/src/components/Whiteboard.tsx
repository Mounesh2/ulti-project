import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import './Whiteboard.css';

interface User {
  id: string;
  username: string;
  color: string;
}

interface DrawingData {
  type: 'draw' | 'erase' | 'rectangle' | 'circle' | 'line' | 'text';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
  text?: string;
  width?: number;
  height?: number;
}

interface WhiteboardProps {
  socket: Socket | null;
  currentUser: User | null;
  onSaveBoard: (canvasData: string) => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, currentUser, onSaveBoard }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [canvasLoaded, setCanvasLoaded] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;

    // Handle window resize
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentColor, lineWidth]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasData = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasData);
    
    // Limit history to 20 states
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleDrawing = (data: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.lineWidth;

      switch (data.type) {
        case 'draw':
        case 'erase':
          ctx.beginPath();
          ctx.moveTo(data.prevX, data.prevY);
          ctx.lineTo(data.x, data.y);
          
          if (data.type === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = data.lineWidth * 2;
          }
          
          ctx.stroke();
          break;

        case 'rectangle':
          if (data.width && data.height) {
            ctx.strokeRect(data.x, data.y, data.width, data.height);
          }
          break;

        case 'circle':
          if (data.width && data.height) {
            const radius = Math.sqrt(data.width * data.width + data.height * data.height);
            ctx.beginPath();
            ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;

        case 'line':
          ctx.beginPath();
          ctx.moveTo(data.prevX, data.prevY);
          ctx.lineTo(data.x, data.y);
          ctx.stroke();
          break;

        case 'text':
          if (data.text) {
            ctx.font = `${data.lineWidth * 10}px Arial`;
            ctx.fillStyle = data.color;
            ctx.fillText(data.text, data.x, data.y);
          }
          break;
      }
      
      ctx.globalCompositeOperation = 'source-over';
    };

    const handleBoardLoaded = (canvasData: string) => {
      if (canvasData && !canvasLoaded) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setCanvasLoaded(true);
        };
        img.src = canvasData;
      }
    };

    socket.on('drawing', handleDrawing);
    socket.on('board-loaded', handleBoardLoaded);

    return () => {
      socket.off('drawing', handleDrawing);
      socket.off('board-loaded', handleBoardLoaded);
    };
  }, [socket, canvasLoaded]);

  // Drawing functions
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [currentUser, currentTool]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentUser || !socket || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and redraw previous state for shape tools
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
      // For shape tools, we'll draw the shape on mouse up
      return;
    }

    // Handle pen and eraser
    if (currentTool === 'pen' || currentTool === 'eraser') {
      const prevX = startPoint.x;
      const prevY = startPoint.y;

      // Draw locally
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      
      if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = lineWidth * 2;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = lineWidth;
      }
      
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';

      // Send drawing data to other users
      const drawingData: DrawingData = {
        type: currentTool === 'pen' ? 'draw' : 'erase',
        x,
        y,
        prevX,
        prevY,
        color: currentColor,
        lineWidth
      };

      socket.emit('drawing', drawingData);
      setStartPoint({ x, y });
    }
  }, [isDrawing, currentUser, socket, currentTool, currentColor, lineWidth, startPoint]);

  const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentUser || !socket || !startPoint) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e ? e.clientX - rect.left : startPoint.x;
    const y = e ? e.clientY - rect.top : startPoint.y;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle shape tools
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
      const width = x - startPoint.x;
      const height = y - startPoint.y;

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;

      switch (currentTool) {
        case 'rectangle':
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;
        case 'circle':
          const radius = Math.sqrt(width * width + height * height);
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          break;
      }

      // Send shape data to other users
      const drawingData: DrawingData = {
        type: currentTool,
        x: startPoint.x,
        y: startPoint.y,
        prevX: startPoint.x,
        prevY: startPoint.y,
        color: currentColor,
        lineWidth,
        width,
        height
      };

      socket.emit('drawing', drawingData);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    saveToHistory();
    
    // Auto-save board state
    const canvasData = canvas.toDataURL();
    onSaveBoard(canvasData);
  }, [isDrawing, currentUser, socket, startPoint, currentTool, currentColor, lineWidth, saveToHistory, onSaveBoard]);

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition || !currentUser || !socket) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw text locally
    ctx.font = `${lineWidth * 10}px Arial`;
    ctx.fillStyle = currentColor;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    // Send text data to other users
    const drawingData: DrawingData = {
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      prevX: textPosition.x,
      prevY: textPosition.y,
      color: currentColor,
      lineWidth,
      text: textInput
    };

    socket.emit('drawing', drawingData);

    // Reset text input
    setTextInput('');
    setShowTextInput(false);
    setTextPosition(null);
    saveToHistory();

    // Save board state
    const canvasData = canvas.toDataURL();
    onSaveBoard(canvasData);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(historyIndex - 1);
      };
      img.src = history[historyIndex - 1];
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(historyIndex + 1);
      };
      img.src = history[historyIndex + 1];
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    
    // Save cleared state
    const canvasData = canvas.toDataURL();
    onSaveBoard(canvasData);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="tool-section">
          <h3>Tools</h3>
          <div className="tool-buttons">
            <button 
              className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`}
              onClick={() => setCurrentTool('pen')}
            >
              ✏️ Pen
            </button>
            <button 
              className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setCurrentTool('eraser')}
            >
              🧹 Eraser
            </button>
            <button 
              className={`tool-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setCurrentTool('rectangle')}
            >
              ⬜ Rectangle
            </button>
            <button 
              className={`tool-btn ${currentTool === 'circle' ? 'active' : ''}`}
              onClick={() => setCurrentTool('circle')}
            >
              ⭕ Circle
            </button>
            <button 
              className={`tool-btn ${currentTool === 'line' ? 'active' : ''}`}
              onClick={() => setCurrentTool('line')}
            >
              📏 Line
            </button>
            <button 
              className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
              onClick={() => setCurrentTool('text')}
            >
              📝 Text
            </button>
          </div>
        </div>

        <div className="tool-section">
          <h3>Colors</h3>
          <div className="color-palette">
            {colors.map(color => (
              <button
                key={color}
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="tool-section">
          <h3>Brush Size</h3>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="brush-size-slider"
          />
          <span className="brush-size-value">{lineWidth}px</span>
        </div>

        <div className="tool-section">
          <h3>Actions</h3>
          <div className="action-buttons">
            <button 
              onClick={undo} 
              className="action-btn undo-btn"
              disabled={historyIndex <= 0}
            >
              ↶ Undo
            </button>
            <button 
              onClick={redo} 
              className="action-btn redo-btn"
              disabled={historyIndex >= history.length - 1}
            >
              ↷ Redo
            </button>
            <button onClick={clearCanvas} className="action-btn clear-btn">
              🗑️ Clear
            </button>
            <button onClick={downloadCanvas} className="action-btn download-btn">
              💾 Download
            </button>
          </div>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={(e) => stopDrawing(e)}
          onMouseLeave={() => stopDrawing()}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            canvasRef.current?.dispatchEvent(mouseEvent);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            canvasRef.current?.dispatchEvent(mouseEvent);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvasRef.current?.dispatchEvent(mouseEvent);
          }}
        />
      </div>

      {/* Text Input Modal */}
      {showTextInput && textPosition && (
        <div className="text-input-modal">
          <div className="text-input-overlay" onClick={() => setShowTextInput(false)}></div>
          <div className="text-input-container">
            <h4>Add Text</h4>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="text-input-field"
              autoFocus
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                } else if (e.key === 'Escape') {
                  setShowTextInput(false);
                  setTextInput('');
                }
              }}
            />
            <div className="text-input-buttons">
              <button onClick={handleTextSubmit} className="text-submit-btn">
                Add Text
              </button>
              <button 
                onClick={() => {
                  setShowTextInput(false);
                  setTextInput('');
                }} 
                className="text-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
