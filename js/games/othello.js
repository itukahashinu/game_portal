import { Game } from '../main.js';
import { OthelloAI } from './ai/othello-ai.js';

class Othello extends Game {
    constructor(container) {
        super(container);
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.ai = new OthelloAI(this);
        this.moveHistory = [];
        this.isSimulation = false;
        this.gameInProgress = false;
    }

    setupBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.boardElement.appendChild(square);
            }
        }
    }

    setupInitialPieces() {
        // 初期配置
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
    }

    renderBoard() {
        const squares = this.boardElement.getElementsByClassName('square');
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                const square = squares[row * 8 + col];
                
                square.innerHTML = '';
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece}`;
                    square.appendChild(pieceElement);
                }

                // 有効な手の表示
                square.classList.remove('valid-move');
                if (!piece && this.isValidMove(row, col)) {
                    square.classList.add('valid-move');
                }
            }
        }
    }

    isValidMove(row, col) {
        if (this.board[row][col]) return false;

        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        return directions.some(([dr, dc]) => 
            this.checkDirection(row, col, dr, dc));
    }

    checkDirection(row, col, dr, dc) {
        let r = row + dr;
        let c = col + dc;
        let hasOpponentPiece = false;

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const piece = this.board[r][c];
            if (!piece) return false;
            if (piece === this.currentPlayer) {
                return hasOpponentPiece;
            }
            hasOpponentPiece = true;
            r += dr;
            c += dc;
        }

        return false;
    }

    makeMove(row, col, isSimulation = false) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const flippedPieces = [];
        
        this.board[row][col] = this.currentPlayer;

        directions.forEach(([dr, dc]) => {
            if (this.checkDirection(row, col, dr, dc)) {
                let r = row + dr;
                let c = col + dc;
                while (this.board[r][c] !== this.currentPlayer) {
                    flippedPieces.push({ row: r, col: c, previousValue: this.board[r][c] });
                    this.board[r][c] = this.currentPlayer;
                    r += dr;
                    c += dc;
                }
            }
        });

        if (!isSimulation) {
            this.moveHistory.push({
                row,
                col,
                player: this.currentPlayer,
                flippedPieces
            });
        }
    }

    async handleAIMove() {
        if (!this.gameInProgress || this.isSimulation) return;

        const aiState = this.ai.getState();
        if (aiState.isThinking) return;

        const move = await this.ai.makeMove();
        if (move) {
            this.makeMove(move.row, move.col);
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
            this.container.querySelector('.current-player').textContent = 
                `現在の手番: ${this.currentPlayer === 'black' ? '黒' : '白'}`;
            this.renderBoard();

            // 次のプレイヤーが打てるかチェック
            if (!this.hasValidMoves()) {
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                if (!this.hasValidMoves()) {
                    this.endGame();
                    return;
                }
                this.container.querySelector('.current-player').textContent = 
                    `現在の手番: ${this.currentPlayer === 'black' ? '黒' : '白'}`;
            }
        }
    }

    async handleSquareClick(row, col) {
        if (!this.isValidMove(row, col)) return;

        this.makeMove(row, col);
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.container.querySelector('.current-player').textContent = 
            `現在の手番: ${this.currentPlayer === 'black' ? '黒' : '白'}`;
        
        this.renderBoard();

        if (!this.hasValidMoves()) {
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
            if (!this.hasValidMoves()) {
                this.endGame();
                return;
            }
        }

        // AIモードでAIの手番の場合
        if (this.gameInProgress && this.currentPlayer === 'white' && !this.isSimulation) {
            await this.handleAIMove();
            
            // プレイヤーの手番をチェック
            if (!this.hasValidMoves()) {
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                if (!this.hasValidMoves()) {
                    this.endGame();
                    return;
                }
                this.container.querySelector('.current-player').textContent = 
                    `現在の手番: ${this.currentPlayer === 'black' ? '黒' : '白'}`;
            }
        }
    }

    undoLastMove() {
        if (this.isSimulation && this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();
            this.board[lastMove.row][lastMove.col] = null;
            lastMove.flippedPieces.forEach(piece => {
                this.board[piece.row][piece.col] = piece.previousValue;
            });
            this.currentPlayer = lastMove.player;
        }
    }

    hasValidMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col)) return true;
            }
        }
        return false;
    }

    endGame() {
        let black = 0;
        let white = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 'black') black++;
                if (this.board[row][col] === 'white') white++;
            }
        }

        const winner = black > white ? '黒' : white > black ? '白' : '引き分け';
        this.container.querySelector('.current-player').textContent = 
            `ゲーム終了 - ${winner}の勝ち! (黒:${black} 白:${white})`;
        
        this.gameInProgress = false;
    }

    async initialize() {
        this.container.innerHTML = `
            <div class="othello-board"></div>
            <div class="othello-info">
                <div class="current-player">現在の手番: 黒</div>
                <div class="controls">
                    <button id="vs-ai">AIと対戦</button>
                    <button id="vs-human">2人で対戦</button>
                </div>
            </div>
        `;
        
        this.boardElement = this.container.querySelector('.othello-board');
        this.setupBoard();
        this.setupInitialPieces();
        this.setupControls();
        this.renderBoard();
    }

    setupControls() {
        const vsAIButton = this.container.querySelector('#vs-ai');
        const vsHumanButton = this.container.querySelector('#vs-human');

        vsAIButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = true;
            this.currentPlayer = 'black'; // 必ずプレイヤーが先手（黒）
            this.container.querySelector('.current-player').textContent = '現在の手番: 黒';
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.renderBoard();
        });

        vsHumanButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = false;
            this.currentPlayer = 'black';
            this.container.querySelector('.current-player').textContent = '現在の手番: 黒';
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.renderBoard();
        });
    }

    resetGame() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.moveHistory = [];
        this.setupInitialPieces();
        this.renderBoard();
        this.container.querySelector('.current-player').textContent = '現在の手番: 黒';
    }

    start() {
        this.gameInProgress = true;
    }

    cleanup() {
        this.gameInProgress = false;
        this.boardElement.innerHTML = '';
        this.moveHistory = [];
    }
}

export default Othello;
