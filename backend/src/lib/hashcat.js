const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config/config.json');

/**
 * Setup and start a hashcat process
 * @param {string} hash - The hash to crack
 * @param {number} hashType - The hashcat hash type ID
 * @param {string} sessionId - Unique session identifier
 * @returns {ChildProcess} The hashcat process
 */
function setupHashcat(hash, hashType, sessionId) {
  // Create hash file
  const hashFilePath = path.join(config.hashcat.outputPath, `${sessionId}.hash`);
  fs.writeFileSync(hashFilePath, hash);
  
  // Create output file path
  const outputFilePath = path.join(config.hashcat.outputPath, `${sessionId}.out`);
  
  // Wordlist path
  const wordlistPath = path.join(config.hashcat.wordlistsPath, config.hashcat.defaultWordlist);
  
  // Rules path
  const rulePath = path.join(config.hashcat.rulesPath, config.hashcat.defaultRule);
  
  // Build hashcat command
  const args = [
    '-m', hashType.toString(),
    '-a', '0', // Dictionary attack
    '-o', outputFilePath,
    '--status',
    '--status-timer', '1',
    '-r', rulePath,
    hashFilePath,
    wordlistPath
  ];
  
  // Start hashcat process
  const process = spawn(config.hashcat.binPath, args);
  
  // Log any errors
  process.stderr.on('data', (data) => {
    console.error(`[Hashcat Error] ${data}`);
  });
  
  return process;
}

module.exports = {
  setupHashcat
}; 