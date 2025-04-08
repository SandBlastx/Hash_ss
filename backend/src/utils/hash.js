const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config/config.json');

/**
 * Hash a password with the specified algorithm
 * @param {string} password - The password to hash
 * @param {number} hashTypeId - The hashcat hash type ID
 * @returns {string} The hashed password
 */
function hashPassword(password, hashTypeId) {
  const hashType = config.hashcat.hashTypes.find(h => h.id === hashTypeId);
  
  if (!hashType) {
    throw new Error(`Unsupported hash type: ${hashTypeId}`);
  }
  
  switch (hashTypeId) {
    case 0: // MD5
      return crypto.createHash('md5').update(password).digest('hex');
    
    case 100: // SHA1
      return crypto.createHash('sha1').update(password).digest('hex');
      
    case 1400: // SHA2-256
      return crypto.createHash('sha256').update(password).digest('hex');
      
    case 1700: // SHA2-512
      return crypto.createHash('sha512').update(password).digest('hex');
      
    case 3200: // bcrypt
      // Note: bcrypt is synchronous here for simplicity
      return bcrypt.hashSync(password, 10);
      
    default:
      throw new Error(`Implementation for hash type ${hashTypeId} not found`);
  }
}

module.exports = {
  hashPassword
}; 