import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  onLogin: (username: string, roomId: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setError('');
    onLogin(username.trim(), roomId.trim());
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h1>🎨 Collaborative Whiteboard</h1>
          <p>Join a room to start collaborating!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div className="room-input-container">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID"
                maxLength={10}
                className="form-input"
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="generate-btn"
                title="Generate random room ID"
              >
                🎲
              </button>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-btn">
            Join Room
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            <strong>How it works:</strong><br />
            • Enter your username and a room ID<br />
            • Share the room ID with others to collaborate<br />
            • Draw, chat, and work together in real-time!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
