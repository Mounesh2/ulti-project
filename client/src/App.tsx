import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import Whiteboard from './components/Whiteboard';
import ChatSidebar from './components/ChatSidebar';
import UserPanel from './components/UserPanel';
import LoginModal from './components/LoginModal';
import './App.css';

interface User {
  id: string;
  username: string;
  color: string;
}

interface Message {
  username: string;
  message: string;
  timestamp: Date;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [showLogin, setShowLogin] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from server');
    });

    newSocket.on('users-updated', (users: User[]) => {
      setActiveUsers(users);
    });

    newSocket.on('chat-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messages-loaded', (loadedMessages: Message[]) => {
      setMessages(loadedMessages);
    });

    newSocket.on('board-loaded', (canvasData: string) => {
      console.log('🖼️ Board loaded');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle user login safely
  const handleLogin = (username: string, roomId: string) => {
    if (!socket) {
      console.warn('Socket not initialized yet.');
      return;
    }

    if (!socket.id) {
      console.warn('Socket ID not available yet. Try again in a moment.');
      return;
    }

    socket.emit('join-room', roomId, username);

    setCurrentUser({
      id: socket.id, // ✅ Guaranteed string now
      username,
      color: getRandomColor(),
    });

    setRoomId(roomId);
    setShowLogin(false);
  };

  // Random color generator
  const getRandomColor = (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Send chat message
  const handleSendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', message.trim());
    }
  };

  // Save board data
  const handleSaveBoard = (canvasData: string) => {
    if (socket) {
      socket.emit('save-board', canvasData);
    }
  };

  if (showLogin) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Collaborative Whiteboard</h1>
        <div className="connection-status">
          <span
            className={`status-indicator ${
              isConnected ? 'connected' : 'disconnected'
            }`}
          ></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="app-content">
        <div className="main-panel">
          <UserPanel users={activeUsers} currentUser={currentUser} />
          <Whiteboard
            socket={socket}
            currentUser={currentUser}
            onSaveBoard={handleSaveBoard}
          />
        </div>

        <ChatSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={currentUser}
          socket={socket}
        />
      </div>
    </div>
  );
};

export default App;
