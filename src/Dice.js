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

module.exports = Dice; 