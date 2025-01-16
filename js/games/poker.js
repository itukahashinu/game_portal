import { Game } from '../main.js';
import { Deck } from './utils/cards.js';
import { PokerAI } from './ai/poker-ai.js';

class Poker extends Game {
    constructor(container) {
        super(container);
        this.deck = new Deck();
        this.playerHand = [];
        this.opponentHand = [];
        this.credits = 100;
        this.opponentCredits = 100;
        this.currentBet = 0;
        this.opponentBet = 0;
        this.gamePhase = 'bet'; // bet, draw, end
        this.ai = new PokerAI(this);
        this.vsAI = false;
    }

    initialize() {
        this.container.innerHTML = `
            <div class="poker-table">
                <div class="game-mode-selection">
                    <button id="vs-ai">AIと対戦</button>
                    <button id="single-play">1人でプレイ</button>
                </div>
                <div class="game-area hidden">
                    <div class="opponent-info">
                        <div class="opponent-credits">AI クレジット: ${this.opponentCredits}</div>
                        <div class="opponent-bet">AI ベット: ${this.opponentBet}</div>
                    </div>
                    <div class="opponent-hand"></div>
                    <div class="player-info">
                        <div class="credits">クレジット: ${this.credits}</div>
                        <div class="current-bet">ベット: ${this.currentBet}</div>
                    </div>
                    <div class="player-hand"></div>
                    <div class="controls">
                        <button class="bet-btn" data-amount="10">ベット 10</button>
                        <button class="bet-btn" data-amount="20">ベット 20</button>
                        <button class="deal-btn">配る</button>
                        <button class="draw-btn" disabled>カードを交換</button>
                    </div>
                    <div class="message"></div>
                </div>
            </div>
        `;

        this.setupModeSelection();

        this.setupEventListeners();
        this.updateDisplay();
    }

    setupModeSelection() {
        const vsAIButton = this.container.querySelector('#vs-ai');
        const singlePlayButton = this.container.querySelector('#single-play');
        const gameArea = this.container.querySelector('.game-area');
        const modeSelection = this.container.querySelector('.game-mode-selection');

        vsAIButton.addEventListener('click', () => {
            this.vsAI = true;
            modeSelection.classList.add('hidden');
            gameArea.classList.remove('hidden');
            this.setupEventListeners();
        });

        singlePlayButton.addEventListener('click', () => {
            this.vsAI = false;
            modeSelection.classList.add('hidden');
            gameArea.classList.remove('hidden');
            this.setupEventListeners();
            this.container.querySelector('.opponent-info').style.display = 'none';
            this.container.querySelector('.opponent-hand').style.display = 'none';
        });
    }

    setupEventListeners() {
        const betButtons = this.container.querySelectorAll('.bet-btn');
        const dealButton = this.container.querySelector('.deal-btn');
        const drawButton = this.container.querySelector('.draw-btn');
        
        betButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.placeBet(amount);
            });
        });

        dealButton.addEventListener('click', () => this.dealCards());
        drawButton.addEventListener('click', () => this.drawPhase());

        this.container.querySelector('.player-hand').addEventListener('click', (e) => {
            if (this.gamePhase !== 'draw') return;
            
            const card = e.target.closest('.card');
            if (card) {
                card.classList.toggle('selected');
            }
        });
    }

    placeBet(amount) {
        if (this.gamePhase !== 'bet' || this.credits < amount) return;
        
        this.currentBet += amount;
        this.credits -= amount;
        this.updateDisplay();
    }

    dealCards() {
        if (this.gamePhase !== 'bet' || this.currentBet === 0) return;

        this.deck.reset();
        this.deck.shuffle();
        this.playerHand = this.deck.drawMultiple(5);
        if (this.vsAI) {
            this.opponentHand = this.deck.drawMultiple(5);
            this.opponentBet = this.ai.decideBet(this);
            this.opponentCredits -= this.opponentBet;
        }
        this.gamePhase = 'draw';
        
        this.updateDisplay();
        this.container.querySelector('.draw-btn').disabled = false;
    }

    handleOpponentTurn() {
        if (!this.vsAI) return;

        // AIの交換する手札を決定
        this.ai.makeMove().then(indicesToChange => {
            if (indicesToChange && indicesToChange.length > 0) {
                indicesToChange.forEach(index => {
                    this.opponentHand[index] = this.deck.draw();
                });
            }
            this.updateDisplay();
            this.evaluateHands();
        });
    }

    evaluateHands() {
        const playerScore = this.evaluateHand(this.playerHand);
        let opponentScore = 0;
        
        if (this.vsAI) {
            opponentScore = this.evaluateHand(this.opponentHand);
            const totalPot = this.currentBet + this.opponentBet;

            if (playerScore > opponentScore) {
                this.win(totalPot, '勝利！');
            } else if (playerScore < opponentScore) {
                this.showMessage('AIの勝利...');
                this.opponentCredits += totalPot;
            } else {
                this.showMessage('引き分け');
                this.credits += this.currentBet;
                this.opponentCredits += this.opponentBet;
            }
        } else {
            // 1人プレイモードの場合は既存の処理を使用
            this.evaluatePlayerHand();
        }
        
        this.resetGame();
    }

    evaluateHand(hand) {
        const ranks = hand.map(card => card.rank);
        const suits = hand.map(card => card.suit);
        
        if (new Set(suits).size === 1) return 5; // フラッシュ
        if (new Set(ranks).size === 2) return 4; // フルハウスまたは4カード
        if (new Set(ranks).size === 3) return 2; // 3カードまたは2ペア
        if (new Set(ranks).size === 4) return 1; // ワンペア
        return 0; // ハイカード
    }

    evaluatePlayerHand() {
        const score = this.evaluateHand(this.playerHand);
        
        switch (score) {
            case 5:
                this.win(this.currentBet * 5, 'フラッシュ！');
                break;
            case 4:
                this.win(this.currentBet * 4, 'フルハウスまたは4カード！');
                break;
            case 2:
                this.win(this.currentBet * 2, '3カードまたは2ペア！');
                break;
            case 1:
                this.win(this.currentBet, 'ワンペア！');
                break;
            default:
                this.showMessage('ハイカード...');
                this.resetGame();
        }
    }

    drawPhase() {
        if (this.gamePhase !== 'draw') return;

        const selectedCards = this.container.querySelectorAll('.card.selected');
        selectedCards.forEach(cardElement => {
            const index = Array.from(cardElement.parentNode.children).indexOf(cardElement);
            this.playerHand[index] = this.deck.draw();
        });

        this.gamePhase = 'end';
        this.evaluateHand();
        this.updateDisplay();
    }

    evaluateHand() {
        const ranks = this.playerHand.map(card => card.rank);
        const suits = this.playerHand.map(card => card.suit);
        
        // 簡易的な役判定（実際のポーカーではもっと複雑）
        if (new Set(suits).size === 1) {
            this.win(this.currentBet * 5, 'フラッシュ！');
        } else if (new Set(ranks).size === 2) {
            this.win(this.currentBet * 4, 'フルハウスまたは4カード！');
        } else if (new Set(ranks).size === 3) {
            this.win(this.currentBet * 2, '3カードまたは2ペア！');
        } else if (new Set(ranks).size === 4) {
            this.win(this.currentBet, 'ワンペア！');
        } else {
            this.showMessage('ハイカード...');
            this.resetGame();
        }
    }

    win(amount, message) {
        this.credits += amount;
        this.showMessage(`${message} +${amount}クレジット！`);
        this.resetGame();
    }

    resetGame() {
        this.currentBet = 0;
        this.gamePhase = 'bet';
        this.container.querySelector('.draw-btn').disabled = true;
    }

    showMessage(message) {
        this.container.querySelector('.message').textContent = message;
    }

    updateDisplay() {
        // クレジットとベット額の更新
        this.container.querySelector('.credits').textContent = `クレジット: ${this.credits}`;
        this.container.querySelector('.current-bet').textContent = `ベット: ${this.currentBet}`;

        if (this.vsAI) {
            this.container.querySelector('.opponent-credits').textContent = 
                `AI クレジット: ${this.opponentCredits}`;
            this.container.querySelector('.opponent-bet').textContent = 
                `AI ベット: ${this.opponentBet}`;

            // AI手札の表示（伏せて表示）
            const opponentHandElement = this.container.querySelector('.opponent-hand');
            opponentHandElement.innerHTML = '';
            this.opponentHand.forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card back';
                opponentHandElement.appendChild(cardElement);
            });
        }

        // プレイヤー手札の表示
        const handElement = this.container.querySelector('.player-hand');
        handElement.innerHTML = '';
        
        this.playerHand.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card.toString();
            handElement.appendChild(cardElement);
        });

        // ボタンの有効/無効切り替え
        const betButtons = this.container.querySelectorAll('.bet-btn');
        betButtons.forEach(btn => {
            const amount = parseInt(btn.dataset.amount);
            btn.disabled = this.gamePhase !== 'bet' || this.credits < amount;
        });

        this.container.querySelector('.deal-btn').disabled = 
            this.gamePhase !== 'bet' || this.currentBet === 0;
    }

    drawPhase() {
        if (this.gamePhase !== 'draw') return;

        const selectedCards = this.container.querySelectorAll('.card.selected');
        selectedCards.forEach(cardElement => {
            const index = Array.from(cardElement.parentNode.children).indexOf(cardElement);
            this.playerHand[index] = this.deck.draw();
        });

        this.handleOpponentTurn();
    }

    start() {
        this.deck.reset();
        this.deck.shuffle();
    }

    cleanup() {
        this.container.innerHTML = '';
    }
}

export default Poker;
