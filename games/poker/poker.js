import { Deck } from '../utils/cards.js';
import { PokerAI } from 'poker-ai.js';

class PokerGame {
    constructor() {
        this.deck = new Deck();
        this.playerHand = [];
        this.opponentHand = [];
        this.credits = 1000;
        this.opponentCredits = 1000;
        this.currentBet = 0;
        this.opponentBet = 0;
        this.gamePhase = 'betting'; // betting, playing, showdown
        this.ai = new PokerAI(this);
        this.vsAI = false;

        // DOM要素の取得
        this.container = document.querySelector('.poker-container');
        this.playerArea = document.querySelector('.player-area');
        this.opponentArea = document.querySelector('.opponent-area');
        this.gameInfo = document.querySelector('.game-info');
        this.chipAmount = document.querySelector('.chip-amount');
        this.currentStatus = document.querySelector('.current-status');
        this.betControls = document.querySelector('.bet-controls');

        this.initialize();
    }

    initialize() {
        this.setupControls();
        this.deck.shuffle();
    }

    setupControls() {
        const vsAIButton = document.querySelector('#vs-ai');
        const vsHumanButton = document.querySelector('#vs-human');
        const betButton = document.querySelector('#bet');
        const callButton = document.querySelector('#call');
        const foldButton = document.querySelector('#fold');
        const exchangeButton = document.querySelector('#exchange');

        vsAIButton.addEventListener('click', () => {
            this.startGame(true);
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.betControls.style.display = 'flex';
        });

        vsHumanButton.addEventListener('click', () => {
            this.startGame(false);
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.betControls.style.display = 'flex';
        });

        betButton.addEventListener('click', () => {
            if (this.gamePhase === 'betting') {
                this.placeBet(100);
            }
        });

        callButton.addEventListener('click', () => {
            if (this.gamePhase === 'betting') {
                this.call();
            }
        });

        foldButton.addEventListener('click', () => {
            if (this.gamePhase !== 'betting') {
                this.fold();
            }
        });

        exchangeButton.addEventListener('click', () => {
            if (this.gamePhase === 'playing') {
                this.handleCardExchange();
            }
        });

        this.playerArea.addEventListener('click', (e) => {
            if (this.gamePhase !== 'playing') return;
            
            const card = e.target.closest('.card');
            if (card) {
                card.classList.toggle('selected');
            }
        });
    }

    startGame(vsAI) {
        this.vsAI = vsAI;
        this.deck.reset();
        this.deck.shuffle();
        this.dealInitialCards();
        this.gamePhase = 'betting';
        this.updateDisplay();
    }

    dealInitialCards() {
        this.playerHand = this.deck.drawMultiple(5);
        if (this.vsAI) {
            this.opponentHand = this.deck.drawMultiple(5);
        }
        this.updateDisplay();
    }

    placeBet(amount) {
        if (this.gamePhase !== 'betting' || this.credits < amount) return;
        
        this.currentBet += amount;
        this.credits -= amount;
        
        if (this.vsAI) {
            // AIのベット処理
            const aiAmount = this.ai.decideBet();
            this.opponentBet = aiAmount;
            this.opponentCredits -= aiAmount;
        }

        this.gamePhase = 'playing';
        this.updateDisplay();
    }

    call() {
        if (this.gamePhase !== 'betting' || this.credits < this.opponentBet - this.currentBet) return;

        this.credits -= (this.opponentBet - this.currentBet);
        this.currentBet = this.opponentBet;
        this.gamePhase = 'playing';
        this.updateDisplay();
    }

    fold() {
        this.opponentCredits += this.currentBet + this.opponentBet;
        this.showMessage('降りました。相手の勝利です。');
        this.endRound();
    }

    async handleOpponentTurn() {
        if (!this.vsAI) return;

        const indicesToChange = await this.ai.makeMove();
        if (indicesToChange && indicesToChange.length > 0) {
            indicesToChange.forEach(index => {
                this.opponentHand[index] = this.deck.draw();
            });
        }
    }

    async handleCardExchange() {
        const selectedCards = document.querySelectorAll('.card.selected');
        selectedCards.forEach(cardElement => {
            const index = Array.from(cardElement.parentNode.children).indexOf(cardElement);
            this.playerHand[index] = this.deck.draw();
        });

        if (this.vsAI) {
            await this.handleOpponentTurn();
        }

        this.gamePhase = 'showdown';
        this.evaluateHands();
        this.updateDisplay();
    }

    evaluateHand(hand) {
        const ranks = hand.map(card => card.rank);
        const suits = hand.map(card => card.suit);
        const rankCounts = {};
        
        // ランクの出現回数をカウント
        ranks.forEach(rank => {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });
        
        const sortedRanks = ranks.map(r => r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : parseInt(r))
            .sort((a, b) => a - b);
        
        // ストレートの判定（A-5も考慮）
        const isLowStraight = JSON.stringify(sortedRanks) === JSON.stringify([2, 3, 4, 5, 14]);
        const isNormalStraight = sortedRanks.every((rank, i) => 
            i === 0 || rank === sortedRanks[i - 1] + 1
        );
        const isStraight = isLowStraight || isNormalStraight;

        const isFlush = new Set(suits).size === 1;
        
        // ストレートフラッシュ
        if (isFlush && isStraight) return 9;
        
        // 4カード
        if (Object.values(rankCounts).some(count => count === 4)) return 8;
        
        // フルハウス
        if (Object.values(rankCounts).some(count => count === 3) &&
            Object.values(rankCounts).some(count => count === 2)) return 7;
        
        // フラッシュ
        if (isFlush) return 6;
        
        // ストレート
        if (isStraight) return 5;
        
        // 3カード
        if (Object.values(rankCounts).some(count => count === 3)) return 4;
        
        // 2ペア
        if (Object.values(rankCounts).filter(count => count === 2).length === 2) return 3;
        
        // ワンペア
        if (Object.values(rankCounts).some(count => count === 2)) return 2;
        
        // ハイカード
        return 1;
    }

    evaluateHands() {
        const playerScore = this.evaluateHand(this.playerHand);
        const opponentScore = this.vsAI ? this.evaluateHand(this.opponentHand) : 0;
        const totalPot = this.currentBet + this.opponentBet;

        if (this.vsAI) {
            if (playerScore > opponentScore) {
                this.credits += totalPot;
                this.showMessage(`勝利！ +${totalPot}チップ獲得！`);
            } else if (playerScore < opponentScore) {
                this.opponentCredits += totalPot;
                this.showMessage('AIの勝利...');
            } else {
                this.credits += this.currentBet;
                this.opponentCredits += this.opponentBet;
                this.showMessage('引き分け');
            }
        } else {
            this.evaluatePlayerHand(playerScore);
        }

        this.endRound();
    }

    evaluatePlayerHand(score) {
        const multipliers = {
            9: { mult: 20, name: 'ストレートフラッシュ' },
            8: { mult: 10, name: '4カード' },
            7: { mult: 7, name: 'フルハウス' },
            6: { mult: 5, name: 'フラッシュ' },
            5: { mult: 4, name: 'ストレート' },
            4: { mult: 3, name: '3カード' },
            3: { mult: 2, name: '2ペア' },
            2: { mult: 1, name: 'ワンペア' },
            1: { mult: 0, name: 'ハイカード' }
        };

        const result = multipliers[score];
        if (result.mult > 0) {
            const winnings = this.currentBet * result.mult;
            this.credits += winnings;
            this.showMessage(`${result.name}！ +${winnings}チップ獲得！`);
        } else {
            this.showMessage(`${result.name}... ベットは没収されました。`);
        }
    }

    endRound() {
        this.gamePhase = 'betting';
        this.currentBet = 0;
        this.opponentBet = 0;
        this.deck.reset();
        this.deck.shuffle();
        this.dealInitialCards();

        if (this.credits <= 0 || (this.vsAI && this.opponentCredits <= 0)) {
            this.gameOver();
        }
    }

    gameOver() {
        const winner = this.credits > 0 ? 'プレイヤー' : 'AI';
        this.showMessage(`ゲーム終了！ ${winner}の勝利です！`);
        document.querySelector('#vs-ai').disabled = false;
        document.querySelector('#vs-human').disabled = false;
    }

    showMessage(message) {
        this.currentStatus.textContent = message;
    }

