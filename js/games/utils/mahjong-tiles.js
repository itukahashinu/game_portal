export class MahjongTile {
    constructor(suit, value) {
        this.suit = suit;    // 萬子(m)、筒子(p)、索子(s)、字牌(z)
        this.value = value;  // 数字1-9、または字牌の種類(1-7)
    }

    toString() {
        const suits = {
            'm': '萬',
            'p': '筒',
            's': '索',
            'z': ['東', '南', '西', '北', '白', '發', '中'][this.value - 1]
        };

        if (this.suit === 'z') {
            return suits[this.suit];
        }
        return `${this.value}${suits[this.suit]}`;
    }
}

export class MahjongSet {
    constructor() {
        this.tiles = [];
        this.reset();
    }

    reset() {
        this.tiles = [];
        // 数牌（萬子、筒子、索子）
        ['m', 'p', 's'].forEach(suit => {
            for (let value = 1; value <= 9; value++) {
                for (let i = 0; i < 4; i++) {
                    this.tiles.push(new MahjongTile(suit, value));
                }
            }
        });

        // 字牌（東南西北白發中）
        for (let value = 1; value <= 7; value++) {
            for (let i = 0; i < 4; i++) {
                this.tiles.push(new MahjongTile('z', value));
            }
        }
    }

    shuffle() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    draw() {
        if (this.tiles.length === 0) return null;
        return this.tiles.pop();
    }

    drawMultiple(count) {
        const tiles = [];
        for (let i = 0; i < count && this.tiles.length > 0; i++) {
            tiles.push(this.draw());
        }
        return tiles;
    }
}

export function findPairs(tiles) {
    const pairs = [];
    const sorted = [...tiles].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.value - b.value;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].suit === sorted[i + 1].suit && 
            sorted[i].value === sorted[i + 1].value) {
            pairs.push([sorted[i], sorted[i + 1]]);
            i++;
        }
    }

    return pairs;
}

export function findChows(tiles, suit) {
    const chows = [];
    const suitTiles = tiles
        .filter(t => t.suit === suit)
        .sort((a, b) => a.value - b.value);

    for (let i = 0; i < suitTiles.length - 2; i++) {
        if (suitTiles[i].value + 1 === suitTiles[i + 1].value &&
            suitTiles[i].value + 2 === suitTiles[i + 2].value) {
            chows.push([suitTiles[i], suitTiles[i + 1], suitTiles[i + 2]]);
        }
    }

    return chows;
}

export function findPungs(tiles) {
    const pungs = [];
    const sorted = [...tiles].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.value - b.value;
    });

    for (let i = 0; i < sorted.length - 2; i++) {
        if (sorted[i].suit === sorted[i + 1].suit &&
            sorted[i].suit === sorted[i + 2].suit &&
            sorted[i].value === sorted[i + 1].value &&
            sorted[i].value === sorted[i + 2].value) {
            pungs.push([sorted[i], sorted[i + 1], sorted[i + 2]]);
            i += 2;
        }
    }

    return pungs;
}
