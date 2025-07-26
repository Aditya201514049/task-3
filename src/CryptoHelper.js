const crypto = require('crypto');

class CryptoHelper {
    static generateSecureKey() {
        return crypto.randomBytes(32); 
    }

    static generateSecureRandomInRange(max) {
        return crypto.randomInt(0, max+1);
    }

    static calculateHMAC(key, message) {
        const hmac = crypto.createHmac('sha3-256', key);
        hmac.update(message.toString());
        return hmac.digest('hex').toUpperCase();
    }
}

module.exports = CryptoHelper; 