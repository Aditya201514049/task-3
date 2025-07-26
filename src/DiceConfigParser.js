const Dice = require('./Dice');

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

module.exports = DiceConfigParser; 