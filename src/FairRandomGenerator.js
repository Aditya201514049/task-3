const CryptoHelper = require('./CryptoHelper');

class FairRandomGenerator {
    constructor(range) {
        this.range = range;
        this.computerNumber = null;
        this.key = null;
        this.hmac = null;
    }

    generateComputerNumber() {
        this.computerNumber = CryptoHelper.generateSecureRandomInRange(this.range);
        this.key = CryptoHelper.generateSecureKey();
        this.hmac = CryptoHelper.calculateHMAC(this.key, this.computerNumber);
        return this.hmac;
    }

    calculateResult(userNumber) {
        if (this.computerNumber === null) {
            throw new Error('Computer number not generated yet');
        }
        const result = (this.computerNumber + userNumber) % (this.range + 1);
        return {
            result,
            computerNumber: this.computerNumber,
            key: this.key.toString('hex').toUpperCase()
        };
    }
}

module.exports = FairRandomGenerator; 