export class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }
}

export class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) return null;
        return this.cards.pop();
    }

    drawMultiple(count) {
        const cards = [];
        for (let i = 0; i < count && this.cards.length > 0; i++) {
            cards.push(this.draw());
        }
        return cards;
    }
}
