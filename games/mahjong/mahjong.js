import { Game } from '../../js/main.js';
import { MahjongSet, findPairs, findChows, findPungs } from './mahjong-tiles.js';

class MahjongGame extends Game {
    initialize() {
        this.mahjongSet = new MahjongSet();
        this.playerHand = [];
        this.player2Hand = [];
        this.player3Hand = [];
        this.player4Hand = [];
        this.discardPiles = {
            player: [],
            left: [],
            right: [],
            opponent: []
        };
        this.selectedIndex = -1;
        this.round = 1;
        this.honba = 0;
        this.gameInProgress = false;
        this.currentTurn = 'player'; // player, right, opponent, left

        this.createGameElements();

        return Promise.resolve();
    }

    start() {
        this.startGame(true);
    }

    cleanup() {
        this.container.innerHTML = '';
    }

    createGameElements() {
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('mahjong-container');

        // プレイヤーエリアの作成
        const createPlayerArea = (className) => {
            const area = document.createElement('div');
            area.classList.add('player-area', className);
            
            const hand = document.createElement('div');
            hand.classList.add('hand');
            area.appendChild(hand);
            
            const discarded = document.createElement('div');
            discarded.classList.add('discarded-tiles');
            area.appendChild(discarded);
            
            return { area, hand, discarded };
        };

        // 各プレイヤーエリアの作成
        const playerElements = createPlayerArea('player');
        const opponentElements = createPlayerArea('opponent');
        const leftElements = createPlayerArea('left');
        const rightElements = createPlayerArea('right');

        // 情報表示エリアの作成
        const infoArea = document.createElement('div');
        infoArea.classList.add('info-area');

        const remainingTiles = document.createElement('div');
        remainingTiles.classList.add('remaining-tiles');
        infoArea.appendChild(remainingTiles);

        const currentStatus = document.createElement('div');
        currentStatus.classList.add('current-status');
        infoArea.appendChild(currentStatus);

        // アクションボタンの作成
        const actionButtons = document.createElement('div');
        actionButtons.classList.add('action-buttons');
        
        const buttons = ['discard', 'chii', 'pon', 'kan', 'riichi', 'tsumo', 'ron'].map(action => {
            const button = document.createElement('button');
            button.id = action;
            button.textContent = action === 'discard' ? '打牌' : action.toUpperCase();
            button.disabled = true;
            return button;
        });
        
        buttons.forEach(button => actionButtons.appendChild(button));
        
        // コントロールボタンの作成
        const controls = document.createElement('div');
        controls.classList.add('controls');
        
        const vsAIButton = document.createElement('button');
        vsAIButton.id = 'vs-ai';
        vsAIButton.textContent = 'AIと対戦';
        
        const vsHumanButton = document.createElement('button');
        vsHumanButton.id = 'vs-human';
        vsHumanButton.textContent = '人と対戦';
        
        controls.appendChild(vsAIButton);
        controls.appendChild(vsHumanButton);

        // 要素の組み立て
        gameContainer.appendChild(infoArea);
        gameContainer.appendChild(playerElements.area);
        gameContainer.appendChild(opponentElements.area);
        gameContainer.appendChild(leftElements.area);
        gameContainer.appendChild(rightElements.area);
        gameContainer.appendChild(actionButtons);
        gameContainer.appendChild(controls);

        this.container.appendChild(gameContainer);

        // 要素の参照を保存
        this.playerArea = playerElements.hand;
        this.playerDiscards = playerElements.discarded;
        this.opponentArea = opponentElements.hand;
        this.opponentDiscards = opponentElements.discarded;
        this.leftArea = leftElements.hand;
        this.leftDiscards = leftElements.discarded;
        this.rightArea = rightElements.hand;
        this.rightDiscards = rightElements.discarded;
        this.remainingTiles = remainingTiles;
        this.currentStatus = currentStatus;

        // イベントリスナーとコントロールの設定（タイミングを遅らせる）
        setTimeout(() => {
            this.setupEventListeners();
            this.setupControls();
        }, 0);
    }

    setupEventListeners() {
        this.playerArea.addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile && this.gameInProgress) {
                const index = Array.from(tile.parentNode.children).indexOf(tile);
                this.selectTile(index);
            }
        });

        document.getElementById('discard').addEventListener('click', () => this.confirmDiscard());
        document.getElementById('chii').addEventListener('click', () => this.chii());
        document.getElementById('pon').addEventListener('click', () => this.pon());
        document.getElementById('kan').addEventListener('click', () => this.kan());
        document.getElementById('riichi').addEventListener('click', () => this.riichi());
        document.getElementById('tsumo').addEventListener('click', () => this.tsumo());
        document.getElementById('ron').addEventListener('click', () => this.ron());
    }

    setupControls() {
        const vsAIButton = document.getElementById('vs-ai');
        const vsHumanButton = document.getElementById('vs-human');

        vsAIButton.addEventListener('click', () => {
            this.startGame(true);
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
        });

        vsHumanButton.addEventListener('click', () => {
            this.startGame(false);
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
        });
    }

    startGame(vsAI) {
        this.gameInProgress = true;
        this.mahjongSet.reset();
        this.mahjongSet.shuffle();
        
        // 配牌
        this.playerHand = this.mahjongSet.drawMultiple(13);
        this.player2Hand = this.mahjongSet.drawMultiple(13);
        this.player3Hand = this.mahjongSet.drawMultiple(13);
        this.player4Hand = this.mahjongSet.drawMultiple(13);
        
        this.sortHand();
        this.updateDisplay();
        this.enableActionButtons(false);
    }

    sortHand() {
        const sortTiles = (tiles) => {
            return tiles.sort((a, b) => {
                if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
                return a.value - b.value;
            });
        };

        this.playerHand = sortTiles(this.playerHand);
        this.player2Hand = sortTiles(this.player2Hand);
        this.player3Hand = sortTiles(this.player3Hand);
        this.player4Hand = sortTiles(this.player4Hand);
    }

    selectTile(index) {
        if (!this.gameInProgress || this.currentTurn !== 'player') return;

        const tiles = this.playerArea.querySelectorAll('.tile');
        tiles.forEach(tile => tile.classList.remove('selected'));
        
        if (this.selectedIndex === index) {
            this.selectedIndex = -1;
        } else {
            this.selectedIndex = index;
            tiles[index].classList.add('selected');
            
            // 捨て牌ボタンを有効化
            const discardButton = document.getElementById('discard');
            if (discardButton) {
                discardButton.disabled = false;
            }
        }
    }

    confirmDiscard() {
        if (this.selectedIndex === -1) return;
        
        this.discardTile(this.selectedIndex);
        const discardButton = document.getElementById('discard');
        if (discardButton) {
            discardButton.disabled = true;
        }
        
        // 次の手番へ
        this.nextTurn();
    }

    nextTurn() {
        const turns = ['player', 'right', 'opponent', 'left'];
        const currentIndex = turns.indexOf(this.currentTurn);
        this.currentTurn = turns[(currentIndex + 1) % 4];
        
        // AIの手番の場合
        if (this.currentTurn !== 'player') {
            setTimeout(() => {
                this.handleAITurn();
            }, 1000);
        }
        
        this.updateDisplay();
    }

    handleAITurn() {
        // 仮のAI行動：ランダムな牌を捨てる
        let hand;
        switch (this.currentTurn) {
            case 'right':
                hand = this.player2Hand;
                break;
            case 'opponent':
                hand = this.player3Hand;
                break;
            case 'left':
                hand = this.player4Hand;
                break;
        }
        
        const randomIndex = Math.floor(Math.random() * hand.length);
        const discarded = hand.splice(randomIndex, 1)[0];
        this.discardPiles[this.currentTurn].push(discarded);
        
        this.nextTurn();
    }

    discardTile(index) {
        if (index < 0 || index >= this.playerHand.length) return;

        const discarded = this.playerHand.splice(index, 1)[0];
        this.discardPiles.player.push(discarded);
        this.selectedIndex = -1;
        this.sortHand();
        this.updateDisplay();
    }

    chii() {
        // チー実装
    }

    pon() {
        // ポン実装
    }

    kan() {
        // カン実装
    }

    riichi() {
        // リーチ実装
    }

    tsumo() {
        // ツモ実装
    }

    ron() {
        // ロン実装
    }

    enableActionButtons(enabled) {
        const buttons = document.querySelectorAll('.action-buttons button');
        buttons.forEach(button => button.disabled = !enabled);
    }

    updateDisplay() {
        // プレイヤーの手札表示
        this.playerArea.innerHTML = '';
        this.playerHand.forEach((tile, index) => {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile';
            if (index === this.selectedIndex) {
                tileElement.classList.add('selected');
            }
            tileElement.textContent = tile.toString();
            this.playerArea.appendChild(tileElement);
        });

        // 他のプレイヤーの手札表示（裏向き）
        this.opponentArea.innerHTML = '';
        this.leftArea.innerHTML = '';
        this.rightArea.innerHTML = '';

        const createBackTiles = (count, container) => {
            for (let i = 0; i < count; i++) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile back';
                container.appendChild(tileElement);
            }
        };

        createBackTiles(this.player2Hand.length, this.opponentArea);
        createBackTiles(this.player3Hand.length, this.leftArea);
        createBackTiles(this.player4Hand.length, this.rightArea);

        // 捨て牌の表示
        this.updateDiscardPile(this.playerDiscards, this.discardPiles.player);
        this.updateDiscardPile(this.opponentDiscards, this.discardPiles.opponent);
        this.updateDiscardPile(this.leftDiscards, this.discardPiles.left);
        this.updateDiscardPile(this.rightDiscards, this.discardPiles.right);

        // 残り牌数の表示
        this.remainingTiles.textContent = `残り牌: ${this.mahjongSet.tiles.length}`;

        // 場況と手番の表示
        const turnDisplay = {
            'player': 'あなた',
            'right': '下家',
            'opponent': '対面',
            'left': '上家'
        };
        this.currentStatus.textContent = 
            `場風: 東 局数: ${this.round}局 本場: ${this.honba} | 現在の手番: ${turnDisplay[this.currentTurn]}`;
    }

    updateDiscardPile(container, tiles) {
        container.innerHTML = '';
        tiles.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile';
            tileElement.textContent = tile.toString();
            container.appendChild(tileElement);
        });
    }

    analyzeHand() {
        const results = {
            pairs: findPairs(this.playerHand),
            chows: {
                m: findChows(this.playerHand, 'm'),
                p: findChows(this.playerHand, 'p'),
                s: findChows(this.playerHand, 's')
            },
            pungs: findPungs(this.playerHand)
        };

        let message = '手牌分析:\n';
        if (results.pairs.length > 0) {
            message += `対子: ${results.pairs.map(p => p[0].toString()).join(', ')}\n`;
        }
        ['m', 'p', 's'].forEach(suit => {
            if (results.chows[suit].length > 0) {
                message += `${suit}順子: ${results.chows[suit].map(c => 
                    c.map(t => t.toString()).join('')
                ).join(', ')}\n`;
            }
        });
        if (results.pungs.length > 0) {
            message += `刻子: ${results.pungs.map(p => 
                p[0].toString() + '×3'
            ).join(', ')}`;
        }

        console.log(message);
    }
}

export default MahjongGame;
