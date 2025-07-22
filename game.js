const crypto = require('crypto');
const readline = require('readline');

// Dice class - represents a single die with its face values
class Dice {
    constructor(faces) {
        if (!Array.isArray(faces) || faces.length !== 6) {
            throw new Error('Dice must have exactly 6 faces');
        }
        if (!faces.every(face => Number.isInteger(face))) {
            throw new Error('All dice faces must be integers');
        }
        this.faces = [...faces];
    }

    getFace(index) {
        if (index < 0 || index >= this.faces.length) {
            throw new Error('Invalid face index');
        }
        return this.faces[index];
    }

    toString() {
        return this.faces.join(',');
    }
}

// Configuration parser - handles command line argument parsing
class DiceConfigParser {
    static parse(args) {
        if (args.length < 3) {
            throw new Error('At least 3 dice must be provided');
        }

        const dice = [];
        for (let i = 0; i < args.length; i++) {
            try {
                const faces = args[i].split(',').map(face => {
                    const num = parseInt(face.trim(), 10);
                    if (isNaN(num)) {
                        throw new Error(`Invalid face value: ${face}`);
                    }
                    return num;
                });

                if (faces.length !== 6) {
                    throw new Error(`Dice ${i + 1} must have exactly 6 faces, got ${faces.length}`);
                }

                dice.push(new Dice(faces));
            } catch (error) {
                throw new Error(`Invalid dice configuration at position ${i + 1}: ${error.message}`);
            }
        }

        return dice;
    }

    static getUsageExample() {
        return 'Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3';
    }
}

// Cryptographic operations - handles secure random generation and HMAC
class CryptoHelper {
    static generateSecureKey() {
        return crypto.randomBytes(32); // 256 bits
    }

    static generateSecureRandomInRange(max) {
        // Generate uniform random number in range [0, max]
        const range = max + 1;
        const maxValid = Math.floor(256 / range) * range;
        
        let randomByte;
        do {
            randomByte = crypto.randomBytes(1)[0];
        } while (randomByte >= maxValid);
        
        return randomByte % range;
    }

    static calculateHMAC(key, message) {
        const hmac = crypto.createHmac('sha3-256', key);
        hmac.update(message.toString());
        return hmac.digest('hex').toUpperCase();
    }
}

// Fair random generation protocol
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

// Probability calculator
class ProbabilityCalculator {
    static calculateWinProbability(dice1, dice2) {
        let wins = 0;
        let total = 0;

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                total++;
                if (dice1.getFace(i) > dice2.getFace(j)) {
                    wins++;
                }
            }
        }

        return wins / total;
    }

    static calculateAllProbabilities(diceArray) {
        const probabilities = [];
        for (let i = 0; i < diceArray.length; i++) {
            probabilities[i] = [];
            for (let j = 0; j < diceArray.length; j++) {
                if (i === j) {
                    probabilities[i][j] = null; // Same dice
                } else {
                    probabilities[i][j] = this.calculateWinProbability(diceArray[i], diceArray[j]);
                }
            }
        }
        return probabilities;
    }
}

// Table generator using ASCII art
class TableGenerator {
    static generate(diceArray, probabilities) {
        const headers = diceArray.map(dice => dice.toString());
        const maxWidth = Math.max(...headers.map(h => h.length), 10);
        
        let table = 'Probability of the win for the user:\n';
        
        // Top border
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        // Header row
        table += '| ' + 'User dice v'.padEnd(maxWidth) + ' |';
        for (const header of headers) {
            table += ' ' + header.padEnd(maxWidth) + ' |';
        }
        table += '\n';
        
        // Separator
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        // Data rows
        for (let i = 0; i < headers.length; i++) {
            table += '| ' + headers[i].padEnd(maxWidth) + ' |';
            for (let j = 0; j < headers.length; j++) {
                let cellContent;
                if (probabilities[i][j] === null) {
                    cellContent = '.3333'; // Diagonal - same dice
                } else {
                    cellContent = probabilities[i][j].toFixed(4);
                }
                table += ' ' + cellContent.padEnd(maxWidth) + ' |';
            }
            table += '\n';
        }
        
        // Bottom border
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        return table;
    }
}

// Main game class
class DiceGame {
    constructor(diceArray) {
        this.dice = diceArray;
        this.probabilities = ProbabilityCalculator.calculateAllProbabilities(diceArray);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        try {
            console.log("Let's determine who makes the first move.");
            const userGoesFirst = await this.determineFirstPlayer();
            
            let computerDiceIndex, userDiceIndex;
            
            if (userGoesFirst) {
                console.log("You make the first move!");
                userDiceIndex = await this.getUserDiceChoice();
                computerDiceIndex = this.getComputerDiceChoice(userDiceIndex);
                console.log(`I choose the [${this.dice[computerDiceIndex].toString()}] dice.`);
            } else {
                console.log("I make the first move!");
                computerDiceIndex = this.getComputerDiceChoice();
                console.log(`I choose the [${this.dice[computerDiceIndex].toString()}] dice.`);
                userDiceIndex = await this.getUserDiceChoice(computerDiceIndex);
            }
            
            console.log(`You choose the [${this.dice[userDiceIndex].toString()}] dice.`);
            
            // Computer roll
            console.log("It's time for my roll.");
            const computerRoll = await this.performRoll();
            const computerResult = this.dice[computerDiceIndex].getFace(computerRoll);
            console.log(`My roll result is ${computerResult}.`);
            
            // User roll
            console.log("It's time for your roll.");
            const userRoll = await this.performRoll();
            const userResult = this.dice[userDiceIndex].getFace(userRoll);
            console.log(`Your roll result is ${userResult}.`);
            
            // Determine winner
            if (userResult > computerResult) {
                console.log(`You win (${userResult} > ${computerResult})!`);
            } else if (computerResult > userResult) {
                console.log(`I win (${computerResult} > ${userResult})!`);
            } else {
                console.log(`It's a tie (${userResult} = ${computerResult})!`);
            }
            
        } catch (error) {
            console.error('Game error:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async determineFirstPlayer() {
        const generator = new FairRandomGenerator(1);
        const hmac = generator.generateComputerNumber();
        
        console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
        console.log("Try to guess my selection.");
        
        const userChoice = await this.getUserChoice(['0 - 0', '1 - 1'], [0, 1]);
        const result = generator.calculateResult(userChoice);
        
        console.log(`My selection: ${result.computerNumber} (KEY=${result.key}).`);
        
        return result.result === userChoice;
    }

    async getUserDiceChoice(excludeIndex = -1) {
        console.log("Choose your dice:");
        const options = [];
        const values = [];
        
        for (let i = 0; i < this.dice.length; i++) {
            if (i !== excludeIndex) {
                options.push(`${i} - ${this.dice[i].toString()}`);
                values.push(i);
            }
        }
        
        return await this.getUserChoice(options, values);
    }

    getComputerDiceChoice(excludeIndex = -1) {
        const availableIndices = [];
        for (let i = 0; i < this.dice.length; i++) {
            if (i !== excludeIndex) {
                availableIndices.push(i);
            }
        }
        return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    async performRoll() {
        const generator = new FairRandomGenerator(5);
        const hmac = generator.generateComputerNumber();
        
        console.log(`I selected a random value in the range 0..5 (HMAC=${hmac}).`);
        console.log("Add your number modulo 6.");
        
        const options = ['0 - 0', '1 - 1', '2 - 2', '3 - 3', '4 - 4', '5 - 5'];
        const values = [0, 1, 2, 3, 4, 5];
        
        const userChoice = await this.getUserChoice(options, values);
        const result = generator.calculateResult(userChoice);
        
        console.log(`My number is ${result.computerNumber} (KEY=${result.key}).`);
        console.log(`The fair number generation result is ${result.computerNumber} + ${userChoice} = ${result.result} (mod 6).`);
        
        return result.result;
    }

    async getUserChoice(options, values) {
        return new Promise((resolve, reject) => {
            const showMenu = () => {
                for (const option of options) {
                    console.log(option);
                }
                console.log('X - exit');
                console.log('? - help');
                this.rl.question('Your selection: ', (answer) => {
                    const choice = answer.trim().toLowerCase();
                    
                    if (choice === 'x') {
                        console.log('Goodbye!');
                        process.exit(0);
                    } else if (choice === '?') {
                        this.showHelp();
                        showMenu();
                    } else {
                        const index = parseInt(choice, 10);
                        const valueIndex = values.indexOf(index);
                        if (valueIndex !== -1) {
                            resolve(values[valueIndex]);
                        } else {
                            console.log('Invalid selection. Please try again.');
                            showMenu();
                        }
                    }
                });
            };
            showMenu();
        });
    }

    showHelp() {
        const helpText = `
Non-Transitive Dice Game Help
============================

This is a game where you and the computer select different dice and roll them.
The player with the higher roll wins.

The interesting property of these dice is that they are "non-transitive":
- Die A might beat Die B more often than not
- Die B might beat Die C more often than not  
- But Die C might beat Die A more often than not

This creates a rock-paper-scissors-like relationship between the dice.

All random number generation in this game is provably fair:
1. The computer generates a secret number and key
2. The computer shows you an HMAC (cryptographic hash) of its number
3. You choose your number
4. The computer reveals its number and key
5. You can verify the HMAC to prove the computer didn't cheat
6. The final result is the sum of both numbers (modulo range)

`;
        console.log(helpText);
        console.log(TableGenerator.generate(this.dice, this.probabilities));
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Error: No dice configurations provided.');
        console.error(DiceConfigParser.getUsageExample());
        process.exit(1);
    }
    
    try {
        const dice = DiceConfigParser.parse(args);
        const game = new DiceGame(dice);
        game.start();
    } catch (error) {
        console.error('Error:', error.message);
        console.error(DiceConfigParser.getUsageExample());
        process.exit(1);
    }
}

// Only run main if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    Dice,
    DiceConfigParser,
    CryptoHelper,
    FairRandomGenerator,
    ProbabilityCalculator,
    TableGenerator,
    DiceGame
};