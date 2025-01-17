import { Game } from '/js/main.js';
import { MahjongSet } from '/js/games/utils/mahjong-tiles.js';

class Mahjong extends Game {
    constructor(container) {
        super(container);
        this.mahjongSet = new MahjongSet();
        this.playerHand = [];
        this.discardPile = [];
        this.selectedIndex = -1;
    }

    async initialize() {
        this.container.innerHTML = `
            <div class="mahjong-table">
                <div class="discard-pile"></div>
                <div class="player-hand"></div>
                <div class="controls">
                    <button class="draw-btn">ツモ</button>
                    <button class="analyze-btn">役分析</button>
                    <button class="start-btn">開始</button>
                </div>
                <div class="message"></div>
            </div>
        `;

        this.setupEventListeners();
        this.renderGame();
    }

    setupEventListeners() {
        const drawButton = this.container.querySelector('.draw-btn');
        const analyzeButton = this.container.querySelector('.analyze-btn');
        const startButton = this.container.querySelector('.start-btn');
        
        drawButton.addEventListener('click', () => this.drawTile());
        analyzeButton.addEventListener('click', () => this.analyzeHand());
        startButton.addEventListener('click', () => this.startGame());

        this.container.querySelector('.player-hand').addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile) {
                const index = Array.from(tile.parentNode.children).indexOf(tile);
                this.selectTile(index);
            }
        });
    }

    startGame() {
        this.mahjongSet.reset();
        this.mahjongSet.shuffle();
        this.playerHand = this.mahjongSet.drawMultiple(13);
        this.discardPile = [];
        this.sortHand();
        this.renderGame();
        this.container.querySelector('.start-btn').disabled = true;
        this.container.querySelector('.draw-btn').disabled = false;
    }

    sortHand() {
        this.playerHand.sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.value - b.value;
        });
    }

    async drawTile() {
        const tile = this.mahjongSet.draw();
        if (tile) {
            this.playerHand.push(tile);
            this.sortHand();
            this.renderGame();
            
            if (this.playerHand.length > 13) {
                this.showMessage('不要な牌を選んで捨ててください');
            }
        } else {
            this.showMessage('山札がありません');
        }
    }

    selectTile(index) {
        if (this.playerHand.length <= 13) return;

        const tiles = this.container.querySelectorAll('.tile');
        tiles.forEach(tile => tile.classList.remove('selected'));
        
        if (this.selectedIndex === index) {
            this.selectedIndex = -1;
        } else {
            this.selectedIndex = index;
            tiles[index].classList.add('selected');
            this.discardTile(index);
        }
    }

    discardTile(index) {
        const discarded = this.playerHand.splice(index, 1)[0];
        this.discardPile.push(discarded);
        this.selectedIndex = -1;
        this.sortHand();
        this.renderGame();
        this.showMessage('');
    }

    analyzeHand() {
        let message = '現在の手牌:\n';
        
        // 種類ごとにグループ化
        const groups = {
            m: [],
            p: [],
            s: [],
            z: []
        };

        this.playerHand.forEach(tile => {
            groups[tile.suit].push(tile);
        });

        // 各種類の牌を表示
        for (const [suit, tiles] of Object.entries(groups)) {
            if (tiles.length === 0) continue;
            
            const suitName = {
                m: '萬子',
                p: '筒子',
                s: '索子',
                z: '字牌'
            }[suit];

            message += `${suitName}: ${tiles.map(t => t.toString()).join(' ')}\n`;
        }

        // 対子と面子の候補を探す
        const pairs = this.findPairs();
        if (pairs.length > 0) {
            message += '\n対子: ' + pairs.map(p => p[0].toString()).join(', ');
        }

        const sequences = this.findSequences();
        if (sequences.length > 0) {
            message += '\n順子: ' + sequences.map(s => 
                s.map(t => t.toString()).join('')
            ).join(', ');
        }

        const triplets = this.findTriplets();
        if (triplets.length > 0) {
            message += '\n刻子: ' + triplets.map(t => 
                t[0].toString() + '×3'
            ).join(', ');
        }

        this.showMessage(message);
    }

    findPairs() {
        const pairs = [];
        const sortedHand = [...this.playerHand].sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.value - b.value;
        });

        for (let i = 0; i < sortedHand.length - 1; i++) {
            if (sortedHand[i].suit === sortedHand[i + 1].suit &&
                sortedHand[i].value === sortedHand[i + 1].value) {
                pairs.push([sortedHand[i], sortedHand[i + 1]]);
                i++;
            }
        }

        return pairs;
    }

    findSequences() {
        const sequences = [];
        const suits = ['m', 'p', 's'];

        suits.forEach(suit => {
            const suitTiles = this.playerHand.filter(t => t.suit === suit)
                .sort((a, b) => a.value - b.value);

            for (let i = 0; i < suitTiles.length - 2; i++) {
                if (suitTiles[i].value + 1 === suitTiles[i + 1].value &&
                    suitTiles[i].value + 2 === suitTiles[i + 2].value) {
                    sequences.push([suitTiles[i], suitTiles[i + 1], suitTiles[i + 2]]);
                }
            }
        });

        return sequences;
    }

    findTriplets() {
        const triplets = [];
        const sortedHand = [...this.playerHand].sort((a, b) => {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.value - b.value;
        });

        for (let i = 0; i < sortedHand.length - 2; i++) {
            if (sortedHand[i].suit === sortedHand[i + 1].suit &&
                sortedHand[i].suit === sortedHand[i + 2].suit &&
                sortedHand[i].value === sortedHand[i + 1].value &&
                sortedHand[i].value === sortedHand[i + 2].value) {
                triplets.push([sortedHand[i], sortedHand[i + 1], sortedHand[i + 2]]);
                i += 2;
            }
        }

        return triplets;
    }

    showMessage(message) {
        this.container.querySelector('.message').textContent = message;
    }

    renderGame() {
        // 手牌の表示
        const handElement = this.container.querySelector('.player-hand');
        handElement.innerHTML = '';
        
        this.playerHand.forEach((tile, index) => {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile';
            if (index === this.selectedIndex) {
                tileElement.classList.add('selected');
            }
            tileElement.textContent = tile.toString();
            handElement.appendChild(tileElement);
        });

        // 捨て牌の表示
        const discardElement = this.container.querySelector('.discard-pile');
        discardElement.innerHTML = '';
        
        this.discardPile.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile discarded';
            tileElement.textContent = tile.toString();
            discardElement.appendChild(tileElement);
        });

        // ボタンの有効/無効
        const drawButton = this.container.querySelector('.draw-btn');
        drawButton.disabled = this.playerHand.length > 13;
    }

    start() {
        this.mahjongSet.reset();
        this.mahjongSet.shuffle();
    }

    cleanup() {
        this.container.innerHTML = '';
        this.playerHand = [];
        this.discardPile = [];
        this.selectedIndex = -1;
    }
}

export default Mahjong;
