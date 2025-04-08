import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(2000);

  const fetchSessions = async () => {
    try {
      const data = await api.getAllSessions();
      setSessions(data);
      setError('');
    } catch (error) {
      setError('Failed to load sessions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Set up polling for session updates
    const intervalId = setInterval(fetchSessions, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const handleStopSession = async (sessionId) => {
    try {
      await api.stopSession(sessionId);
      // Update sessions after stopping
      fetchSessions();
    } catch (error) {
      setError(`Failed to stop session: ${error.message}`);
    }
  };

  const formatDuration = (startTime) => {
    const duration = Date.now() - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  return (
    <div className="sessions-page">
      <header>
        <h1>Active Sessions</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      
      <main>
        {error && <div className="error-message">{error}</div>}
        
        <div className="refresh-controls">
          <label>
            Refresh Interval:
            <select 
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </label>
          <button onClick={fetchSessions}>Refresh Now</button>
        </div>
        
        {loading && sessions.length === 0 ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No active sessions found.</p>
        ) : (
          <div className="sessions-list">
            {sessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <h3>Session {session.id}</h3>
                  <span className={`status-badge status-${session.status}`}>
                    {session.status}
                  </span>
                </div>
                
                <div className="session-details">
                  <div className="detail-item">
                    <span>Hash:</span>
                    <code>{session.hash}</code>
                  </div>
                  
                  <div className="detail-item">
                    <span>Hash Type:</span>
                    <span>{session.hashType}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span>Running Time:</span>
                    <span>{formatDuration(session.startTime)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span>Progress:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${session.progress}%` }}
                      />
                      <span>{session.progress}%</span>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <span>Speed:</span>
                    <span>{session.speed || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span>Temperature:</span>
                    <span>{session.temp ? `${session.temp}°C` : 'N/A'}</span>
                  </div>
                  
                  {session.recovered && (
                    <div className="detail-item recovered">
                      <span>Password Found:</span>
                      <strong>{session.originalPassword}</strong>
                    </div>
                  )}
                </div>
                
                <div className="session-actions">
                  {session.status === 'running' && (
                    <button 
                      onClick={() => handleStopSession(session.id)}
                      className="stop-button"
                    >
                      Stop Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionsPage; 