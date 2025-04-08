// Server configuration storage
export const SERVER_MODES = {
  LOCAL: 'local',
  REMOTE: 'remote'
};

// Default configuration
const defaultConfig = {
  mode: SERVER_MODES.LOCAL,
  url: 'http://localhost:3000',
  requireAuth: false,
  username: '',
  password: '',
  token: ''
};

// Get the current configuration from localStorage or use default
export const getServerConfig = () => {
  const stored = localStorage.getItem('hashcracker-server-config');
  return stored ? JSON.parse(stored) : defaultConfig;
};

// Save configuration to localStorage
export const saveServerConfig = (config) => {
  localStorage.setItem('hashcracker-server-config', JSON.stringify(config));
};

// Base API functions with authentication handling
const api = {
  // Get base URL from configuration
  getBaseUrl: () => {
    const config = getServerConfig();
    return config.url;
  },
  
  // Get headers including authentication if needed
  getHeaders: () => {
    const config = getServerConfig();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (config.requireAuth && config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }
    
    return headers;
  },
  
  // Login function
  login: async (username, password) => {
    const config = getServerConfig();
    
    try {
      const response = await fetch(`${config.url}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update config with token and username
        const updatedConfig = { 
          ...config, 
          token: data.token, 
          username 
        };
        
        saveServerConfig(updatedConfig);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },
  
  // Check server health (no auth required)
  checkHealth: async () => {
    const url = `${api.getBaseUrl()}/api/health`;
    
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
  
  // Get hashcat configuration
  getConfig: async () => {
    const url = `${api.getBaseUrl()}/api/config`;
    
    try {
      const response = await fetch(url, {
        headers: api.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get config: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get config:', error);
      throw error;
    }
  },
  
  // Start cracking a password
  crackPassword: async (password, hashType) => {
    const url = `${api.getBaseUrl()}/api/crack`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify({ password, hashType })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start cracking: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to start cracking:', error);
      throw error;
    }
  },
  
  // Get status of a session
  getSessionStatus: async (sessionId) => {
    const url = `${api.getBaseUrl()}/api/sessions/${sessionId}`;
    
    try {
      const response = await fetch(url, {
        headers: api.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get session status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get session status:', error);
      throw error;
    }
  },
  
  // Get all sessions
  getAllSessions: async () => {
    const url = `${api.getBaseUrl()}/api/sessions`;
    
    try {
      const response = await fetch(url, {
        headers: api.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get sessions: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  },
  
  // Stop a session
  stopSession: async (sessionId) => {
    const url = `${api.getBaseUrl()}/api/sessions/${sessionId}/stop`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: api.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to stop session: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to stop session:', error);
      throw error;
    }
  }
};

export default api; 