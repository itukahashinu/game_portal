// 麻雀牌の種類
const SUITS = ['m', 'p', 's', 'z']; // 萬子、筒子、索子、字牌
const VALUES = {
    m: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    p: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    s: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    z: [1, 2, 3, 4, 5, 6, 7] // 東南西北白発中
};

class MahjongTile {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        const symbols = {
            m: ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'],
            p: ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'],
            s: ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'],
            z: ['🀀', '🀁', '🀂', '🀃', '🀆', '🀅', '🀄'] // 東南西北白発中
        };
        return symbols[this.suit][this.value - 1];
    }

    equals(other) {
        return this.suit === other.suit && this.value === other.value;
    }
}

export class MahjongSet {
    constructor() {
        this.tiles = [];
        this.reset();
    }

    reset() {
        this.tiles = [];
        // 各種牌を4枚ずつ作成
        SUITS.forEach(suit => {
            VALUES[suit].forEach(value => {
                for (let i = 0; i < 4; i++) {
                    this.tiles.push(new MahjongTile(suit, value));
                }
            });
        });
    }

    shuffle() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    draw() {
        return this.tiles.pop();
    }

    drawMultiple(count) {
        const drawn = [];
        for (let i = 0; i < count; i++) {
            if (this.tiles.length > 0) {
                drawn.push(this.draw());
            }
        }
        return drawn;
    }
}

// 対子（同じ牌が2枚）を見つける
export function findPairs(tiles) {
    const pairs = [];
    for (let i = 0; i < tiles.length - 1; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].equals(tiles[j])) {
                pairs.push([tiles[i], tiles[j]]);
            }
        }
    }
    return pairs;
}

// 順子（連続した3つの数牌）を見つける
export function findChows(tiles, suit) {
    const chows = [];
    const suitTiles = tiles.filter(t => t.suit === suit).sort((a, b) => a.value - b.value);

    for (let i = 0; i < suitTiles.length - 2; i++) {
        for (let j = i + 1; j < suitTiles.length - 1; j++) {
            for (let k = j + 1; k < suitTiles.length; k++) {
                if (suitTiles[i].value + 1 === suitTiles[j].value &&
                    suitTiles[j].value + 1 === suitTiles[k].value) {
                    chows.push([suitTiles[i], suitTiles[j], suitTiles[k]]);
                }
            }
        }
    }
    return chows;
}

// 刻子（同じ牌が3枚）を見つける
export function findPungs(tiles) {
    const pungs = [];
    for (let i = 0; i < tiles.length - 2; i++) {
        for (let j = i + 1; j < tiles.length - 1; j++) {
            for (let k = j + 1; k < tiles.length; k++) {
                if (tiles[i].equals(tiles[j]) && tiles[j].equals(tiles[k])) {
                    pungs.push([tiles[i], tiles[j], tiles[k]]);
                }
            }
        }
    }
    return pungs;
}
