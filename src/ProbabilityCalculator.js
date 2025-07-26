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

module.exports = ProbabilityCalculator; 