const readline = require('readline');
const FairRandomGenerator = require('./FairRandomGenerator');
const TableGenerator = require('./TableGenerator');
const ProbabilityCalculator = require('./ProbabilityCalculator');

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
            
            
            console.log("It's time for my roll.");
            const computerRoll = await this.performRoll();
            const computerResult = this.dice[computerDiceIndex].getFace(computerRoll);
            console.log(`My roll result is ${computerResult}.`);
            
            
            console.log("It's time for your roll.");
            const userRoll = await this.performRoll();
            const userResult = this.dice[userDiceIndex].getFace(userRoll);
            console.log(`Your roll result is ${userResult}.`);
            
            
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
        
        return result.computerNumber === userChoice;

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

module.exports = DiceGame; 