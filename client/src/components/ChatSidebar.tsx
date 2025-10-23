import React, { useState, useRef, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import './ChatSidebar.css';

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

interface ChatSidebarProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentUser: User | null;
  socket: Socket | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  onSendMessage, 
  currentUser, 
  socket 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: { username: string; isTyping: boolean }) => {
      if (data.username === currentUser?.username) return;

      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          return prev.filter(user => user !== data.username);
        }
      });
    };

    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser) {
      onSendMessage(newMessage);
      setNewMessage('');
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket || !currentUser) return;

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      socket.emit('typing', false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', false);
    }, 1000);
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-header">
        <h3>💬 Chat</h3>
        <div className="chat-status">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.username === currentUser?.username ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-username">{message.username}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-content">{message.message}</div>
            </div>
          ))
        )}
        
        {getTypingText() && (
          <div className="typing-indicator">
            <span className="typing-text">{getTypingText()}</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="chat-input"
            maxLength={500}
            disabled={!currentUser}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim() || !currentUser}
          >
            📤
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSidebar;
