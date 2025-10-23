import React from 'react';
import './UserPanel.css';

interface User {
  id: string;
  username: string;
  color: string;
}

interface UserPanelProps {
  users: User[];
  currentUser: User | null;
}

const UserPanel: React.FC<UserPanelProps> = ({ users, currentUser }) => {
  return (
    <div className="user-panel">
      <div className="user-panel-header">
        <h3>👥 Active Users</h3>
        <span className="user-count">{users.length}</span>
      </div>
      
      <div className="users-list">
        {users.length === 0 ? (
          <div className="no-users">
            <p>No users online</p>
          </div>
        ) : (
          users.map(user => (
            <div 
              key={user.id} 
              className={`user-item ${user.id === currentUser?.id ? 'current-user' : ''}`}
            >
              <div 
                className="user-avatar"
                style={{ backgroundColor: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user.username}
                  {user.id === currentUser?.id && ' (You)'}
                </span>
                <div className="user-status">
                  <span className="status-dot online"></span>
                  Online
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="user-panel-footer">
        <div className="room-info">
          <span className="room-label">Room:</span>
          <span className="room-id">{currentUser ? 'Connected' : 'Not connected'}</span>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
