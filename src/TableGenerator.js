class TableGenerator {
    static generate(diceArray, probabilities) {
        const headers = diceArray.map(dice => dice.toString());
        const maxWidth = Math.max(...headers.map(h => h.length), 10);
        
        let table = 'Probability of the win for the user:\n';
        
        
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        
        table += '| ' + 'User dice v'.padEnd(maxWidth) + ' |';
        for (const header of headers) {
            table += ' ' + header.padEnd(maxWidth) + ' |';
        }
        table += '\n';
        
        
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        
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
        
        
        table += '+' + '-'.repeat(maxWidth + 2) + '+';
        for (let i = 0; i < headers.length; i++) {
            table += '-'.repeat(maxWidth + 2) + '+';
        }
        table += '\n';
        
        return table;
    }
}

module.exports = TableGenerator; 