const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const config = require('./config/config.json');
const { setupHashcat } = require('./lib/hashcat');
const { hashPassword } = require('./utils/hash');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware
const authenticateUser = (req, res, next) => {
  if (!config.server.auth.enabled || config.server.mode === 'local') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const user = jwt.verify(token, config.server.auth.jwtSecret);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === config.server.auth.username && password === config.server.auth.password) {
    const token = jwt.sign({ username }, config.server.auth.jwtSecret, {
      expiresIn: config.server.auth.tokenExpiration
    });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply authentication to protected routes
app.use('/api', authenticateUser);

// Hashcat sessions store
const activeSessions = new Map();

// Get hashcat configuration
app.get('/api/config', (req, res) => {
  // Return safe configuration (excluding sensitive data)
  res.json({
    hashTypes: config.hashcat.hashTypes,
    defaultHashType: config.hashcat.defaultHashType
  });
});

// Start cracking job
app.post('/api/crack', async (req, res) => {
  const { password, hashType = config.hashcat.defaultHashType } = req.body;
  
  try {
    // Generate a hash from the password
    const hash = hashPassword(password, hashType);
    
    // Create a session ID
    const sessionId = Date.now().toString();
    
    // Start hashcat process
    const hashcatProcess = setupHashcat(hash, hashType, sessionId);
    
    // Store session information
    activeSessions.set(sessionId, {
      hash,
      hashType,
      startTime: Date.now(),
      status: 'running',
      process: hashcatProcess,
      progress: 0,
      speed: 0,
      temp: 0,
      recovered: false,
      originalPassword: null
    });
    
    // Set up process output handling
    hashcatProcess.stdout.on('data', (data) => {
      const output = data.toString();
      updateSessionFromOutput(sessionId, output);
    });
    
    hashcatProcess.on('close', (code) => {
      if (activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        session.status = code === 0 ? 'completed' : 'failed';
        activeSessions.set(sessionId, session);
      }
    });
    
    res.json({ 
      sessionId,
      message: 'Cracking job started'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session status
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!activeSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = activeSessions.get(sessionId);
  // Filter out sensitive or unnecessary info
  const { process, ...safeSession } = session;
  
  res.json(safeSession);
});

// Get all active sessions
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([id, session]) => {
    const { process, ...safeSession } = session;
    return { id, ...safeSession };
  });
  
  res.json(sessions);
});

// Stop a session
app.post('/api/sessions/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  
  if (!activeSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = activeSessions.get(sessionId);
  
  if (session.process && typeof session.process.kill === 'function') {
    session.process.kill();
    session.status = 'stopped';
    activeSessions.set(sessionId, session);
  }
  
  res.json({ message: 'Session stopped' });
});

// Helper function to parse hashcat output and update session
function updateSessionFromOutput(sessionId, output) {
  if (!activeSessions.has(sessionId)) return;
  
  const session = activeSessions.get(sessionId);
  
  // Parse progress
  const progressMatch = output.match(/Progress\.+:\s+(\d+)%/);
  if (progressMatch) {
    session.progress = parseInt(progressMatch[1], 10);
  }
  
  // Parse speed
  const speedMatch = output.match(/Speed\.+:\s+([\d.]+ .?H\/s)/);
  if (speedMatch) {
    session.speed = speedMatch[1];
  }
  
  // Parse temperature
  const tempMatch = output.match(/Temp\.+:\s+(\d+)C/);
  if (tempMatch) {
    session.temp = parseInt(tempMatch[1], 10);
  }
  
  // Check for cracked password
  const crackedMatch = output.match(/^([0-9a-f]+):(.+)$/m);
  if (crackedMatch && crackedMatch[1] === session.hash) {
    session.recovered = true;
    session.originalPassword = crackedMatch[2];
    session.status = 'completed';
  }
  
  activeSessions.set(sessionId, session);
}

// Start the server
const port = config.server.port;
const host = config.server.mode === 'remote' ? '0.0.0.0' : config.server.host;

app.listen(port, host, () => {
  console.log(`HashCracker server running in ${config.server.mode} mode on ${host}:${port}`);
  console.log(`Authentication ${config.server.auth.enabled ? 'enabled' : 'disabled'}`);
}); 