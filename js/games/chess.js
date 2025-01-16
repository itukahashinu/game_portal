import { Game } from '../main.js';
import { ChessAI } from './ai/chess-ai.js';

class Chess extends Game {
    constructor(container) {
        super(container);
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.ai = new ChessAI(this);
        this.moveHistory = [];
        this.isSimulation = false;
        this.gameInProgress = false;
    }

    initialize() {
        this.container.innerHTML = `
            <div class="chess-board"></div>
            <div class="chess-info">
                <div class="current-player">現在の手番: 白</div>
                <div class="controls">
                    <button id="vs-ai">AIと対戦</button>
                    <button id="vs-human">2人で対戦</button>
                </div>
            </div>
        `;
        
        this.boardElement = this.container.querySelector('.chess-board');
        this.setupBoard();
        this.setupInitialPieces();
        this.setupControls();
        this.renderBoard();
    }

    setupBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.boardElement.appendChild(square);
            }
        }
    }

    setupInitialPieces() {
        const setupRow = (row, color) => {
            this.board[row] = [
                { type: 'rook', color },
                { type: 'knight', color },
                { type: 'bishop', color },
                { type: 'queen', color },
                { type: 'king', color },
                { type: 'bishop', color },
                { type: 'knight', color },
                { type: 'rook', color }
            ];
        };

        setupRow(0, 'black');
        setupRow(7, 'white');

        // ポーンの配置
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black' };
            this.board[6][col] = { type: 'pawn', color: 'white' };
        }
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
                    pieceElement.className = `piece ${piece.color} ${piece.type}`;
                    pieceElement.innerHTML = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }

                square.classList.remove('highlight');
                if (this.selectedPiece && this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                    square.classList.add('highlight');
                }
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            king: '♔',
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘',
            pawn: '♙'
        };
        return symbols[piece.type];
    }

    handleSquareClick(row, col) {
        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.selectedPiece = null;
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.container.querySelector('.current-player').textContent = 
                    `現在の手番: ${this.currentPlayer === 'white' ? '白' : '黒'}`;
            } else {
                this.selectedPiece = null;
            }
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = { row, col };
        }

        this.renderBoard();
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];

        if (!piece || (target && target.color === piece.color)) {
            return false;
        }

        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;
                
                // 通常の1マス前進
                if (fromCol === toCol && toRow === fromRow + direction && !target) {
                    return true;
                }
                
                // 初期位置からの2マス前進
                if (fromCol === toCol && fromRow === startRow && 
                    toRow === fromRow + 2 * direction && !target) {
                    return true;
                }
                
                // 斜めの駒取り
                if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && target) {
                    return true;
                }
                break;

            case 'rook':
                return fromRow === toRow || fromCol === toCol;

            case 'bishop':
                return Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol);

            case 'knight':
                return (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) ||
                       (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2);

            case 'queen':
                return fromRow === toRow || fromCol === toCol ||
                       Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol);

            case 'king':
                return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
        }

        return false;
    }

    setupControls() {
        const vsAIButton = this.container.querySelector('#vs-ai');
        const vsHumanButton = this.container.querySelector('#vs-human');

        vsAIButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = true;
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
        });

        vsHumanButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = false;
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
        });
    }

    resetGame() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.setupInitialPieces();
        this.renderBoard();
        this.container.querySelector('.current-player').textContent = '現在の手番: 白';
    }

    movePiece(fromRow, fromCol, toRow, toCol, isSimulation = false) {
        const capturedPiece = this.board[toRow][toCol];
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;

        if (!isSimulation) {
            this.moveHistory.push({
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                capturedPiece,
                piece: this.board[toRow][toCol]
            });

            // AIの手番
            if (this.gameInProgress && this.currentPlayer === 'black' && !this.isSimulation) {
                setTimeout(() => this.handleAIMove(), 500);
            }
        }
    }

    async handleAIMove() {
        const move = await this.ai.makeMove();
        if (move) {
            this.movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
            this.currentPlayer = 'white';
            this.container.querySelector('.current-player').textContent = '現在の手番: 白';
            this.renderBoard();
        }
    }

    undoLastMove() {
        if (this.isSimulation && this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();
            this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        }
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

export default Chess;
