const DiceConfigParser = require('./src/DiceConfigParser');
const DiceGame = require('./src/DiceGame');

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

if (require.main === module) {
    main();
} 



