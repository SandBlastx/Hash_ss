import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getServerConfig, saveServerConfig, SERVER_MODES } from '../services/api';

const SettingsPage = () => {
  const [config, setConfig] = useState(getServerConfig());
  const [username, setUsername] = useState(config.username || '');
  const [password, setPassword] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [statusClass, setStatusClass] = useState('');

  const handleModeChange = (mode) => {
    const newConfig = { ...config, mode };
    
    // Set default URL based on mode
    if (mode === SERVER_MODES.LOCAL) {
      newConfig.url = 'http://localhost:3000';
      newConfig.requireAuth = false;
    }
    
    setConfig(newConfig);
  };

  const handleSave = () => {
    saveServerConfig(config);
    alert('Settings saved successfully!');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('');
    
    try {
      const isHealthy = await api.checkHealth();
      
      if (!isHealthy) {
        setConnectionStatus('Server is not responding. Please check the URL.');
        setStatusClass('error');
        setTestingConnection(false);
        return;
      }
      
      if (config.requireAuth) {
        const loginSuccess = await api.login(username, password);
        
        if (loginSuccess) {
          setConnectionStatus('Connection successful! Authentication verified.');
          setStatusClass('success');
        } else {
          setConnectionStatus('Authentication failed. Please check your credentials.');
          setStatusClass('error');
        }
      } else {
        setConnectionStatus('Connection successful!');
        setStatusClass('success');
      }
    } catch (error) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      setStatusClass('error');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="settings-page">
      <header>
        <h1>Server Settings</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/sessions">Sessions</Link>
        </nav>
      </header>
      
      <main>
        <section className="server-config">
          <h2>Backend Server Configuration</h2>
          
          <div className="config-section">
            <h3>Server Mode</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={config.mode === SERVER_MODES.LOCAL}
                  onChange={() => handleModeChange(SERVER_MODES.LOCAL)}
                />
                Local (http://localhost:3000)
              </label>
              
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={config.mode === SERVER_MODES.REMOTE}
                  onChange={() => handleModeChange(SERVER_MODES.REMOTE)}
                />
                Remote Server
              </label>
            </div>
          </div>
          
          {config.mode === SERVER_MODES.REMOTE && (
            <>
              <div className="config-section">
                <h3>Remote Server URL</h3>
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://your-server-url.com"
                />
              </div>
              
              <div className="config-section">
                <h3>Authentication</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.requireAuth}
                    onChange={(e) => setConfig({ ...config, requireAuth: e.target.checked })}
                  />
                  Require Authentication
                </label>
                
                {config.requireAuth && (
                  <div className="auth-fields">
                    <div className="form-group">
                      <label>Username:</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Password:</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="config-actions">
            <button 
              onClick={handleTestConnection} 
              disabled={testingConnection}
              className="test-button"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button 
              onClick={handleSave}
              className="save-button"
            >
              Save Settings
            </button>
          </div>
          
          {connectionStatus && (
            <div className={`connection-status ${statusClass}`}>
              {connectionStatus}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SettingsPage; 