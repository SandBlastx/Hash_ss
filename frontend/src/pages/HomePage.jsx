import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [password, setPassword] = useState('');
  const [hashType, setHashType] = useState(0);
  const [hashTypes, setHashTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [config, setConfig] = useState(null);

  // Fetch hash types on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await api.getConfig();
        setHashTypes(config.hashTypes);
        setHashType(config.defaultHashType);
        setConfig(config);
      } catch (error) {
        setError('Failed to load configuration. Please check server connection.');
      }
    };

    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.crackPassword(password, hashType);
      setSessionId(response.sessionId);
    } catch (error) {
      setError(error.message || 'Failed to start cracking job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header>
        <h1>HashCracker</h1>
        <nav>
          <Link to="/sessions">Sessions</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      
      <main>
        <section className="password-form">
          <h2>Crack a Password</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          {sessionId ? (
            <div className="success-message">
              <p>Cracking job started!</p>
              <p>Session ID: {sessionId}</p>
              <Link to={`/sessions/${sessionId}`}>View Progress</Link>
              <button onClick={() => setSessionId('')}>Crack Another Password</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">Password to Crack:</label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter password to crack"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="hash-type">Hash Type:</label>
                <select
                  id="hash-type"
                  value={hashType}
                  onChange={(e) => setHashType(Number(e.target.value))}
                  disabled={loading || hashTypes.length === 0}
                >
                  {hashTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" disabled={loading || !password}>
                {loading ? 'Starting...' : 'Start Cracking'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default HomePage; 