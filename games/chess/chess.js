import { Game } from '../../js/main.js';
import { ChessAI } from './chess-ai.js';

class ChessGame extends Game {
    initialize() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.ai = new ChessAI(this);
        this.moveHistory = [];
        this.isSimulation = false;
        this.gameInProgress = false;
        
        this.createBoard();
        this.setupInitialPieces();
        this.setupControls();
        
        return Promise.resolve();
    }

    start() {
        this.gameInProgress = true;
        this.currentPlayer = 'white';
        this.updateStatus();
        this.renderBoard();
    }

    cleanup() {
        this.container.innerHTML = '';
    }

    createBoard() {
        const container = document.createElement('div');
        container.classList.add('chess-info');
        
        const statusText = document.createElement('div');
        statusText.classList.add('current-player');
        statusText.textContent = '現在の手番: 白';
        this.statusText = statusText;
        container.appendChild(statusText);

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
        container.appendChild(controls);

        const board = document.createElement('div');
        board.classList.add('chess-board');
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                board.appendChild(square);
            }
        }
        
        this.boardElement = board;
        container.appendChild(board);
        this.container.appendChild(container);
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
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.innerHTML = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }

                square.classList.remove('valid-move', 'selected');
                if (this.selectedPiece && 
                    row === this.selectedPiece.row && 
                    col === this.selectedPiece.col) {
                    square.classList.add('selected');
                } else if (this.selectedPiece && 
                         this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                    square.classList.add('valid-move');
                }
            }
        }
    }

    updateStatus() {
        this.statusText.textContent = `現在の手番: ${this.currentPlayer === 'white' ? '白' : '黒'}`;
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

    async handleSquareClick(row, col) {
        if (!this.gameInProgress) return;
        
        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.selectedPiece = null;
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.updateStatus();
                this.renderBoard();

                // AIの手番
                if (this.gameInProgress && this.currentPlayer === 'black' && !this.isSimulation) {
                    await this.handleAIMove();
                }
            } else {
                this.selectedPiece = null;
                this.renderBoard();
            }
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = { row, col };
            this.renderBoard();
        }
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
                if (!(fromRow === toRow || fromCol === toCol)) return false;
                
                // 経路上の駒のチェック
                const dr = Math.sign(toRow - fromRow);
                const dc = Math.sign(toCol - fromCol);
                let r = fromRow + dr;
                let c = fromCol + dc;
                while (r !== toRow || c !== toCol) {
                    if (this.board[r][c]) return false;
                    r += dr;
                    c += dc;
                }
                return true;

            case 'bishop':
                if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
                
                // 経路上の駒のチェック
                const bishopDr = Math.sign(toRow - fromRow);
                const bishopDc = Math.sign(toCol - fromCol);
                let bishopR = fromRow + bishopDr;
                let bishopC = fromCol + bishopDc;
                while (bishopR !== toRow && bishopC !== toCol) {
                    if (this.board[bishopR][bishopC]) return false;
                    bishopR += bishopDr;
                    bishopC += bishopDc;
                }
                return true;

            case 'knight':
                return (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) ||
                       (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2);

            case 'queen':
                if (!(fromRow === toRow || fromCol === toCol ||
                    Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol))) return false;
                
                // 経路上の駒のチェック
                const queenDr = Math.sign(toRow - fromRow);
                const queenDc = Math.sign(toCol - fromCol);
                let queenR = fromRow + queenDr;
                let queenC = fromCol + queenDc;
                while (queenR !== toRow || queenC !== toCol) {
                    if (this.board[queenR][queenC]) return false;
                    queenR += queenDr;
                    queenC += queenDc;
                }
                return true;

            case 'king':
                return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
        }

        return false;
    }

    setupControls() {
        const vsAIButton = document.getElementById('vs-ai');
        const vsHumanButton = document.getElementById('vs-human');

        vsAIButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = true;
            this.currentPlayer = 'white'; // プレイヤーは常に白
            this.updateStatus();
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.renderBoard();
        });

        vsHumanButton.addEventListener('click', () => {
            this.resetGame();
            this.gameInProgress = true;
            this.currentPlayer = 'white';
            this.updateStatus();
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            this.renderBoard();
        });
    }

    resetGame() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.setupInitialPieces();
        this.renderBoard();
        this.updateStatus();
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
                piece: this.board[toRow][toCol],
                player: this.currentPlayer
            });
        }
    }

    async handleAIMove() {
        if (!this.gameInProgress || this.isSimulation) return;

        const aiState = this.ai.getState();
        if (aiState.isThinking) return;

        const move = await this.ai.makeMove();
        if (move) {
            this.movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.updateStatus();
            this.renderBoard();
        }
    }

    undoLastMove() {
        if (this.isSimulation && this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();
            this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
            this.currentPlayer = lastMove.player;
        }
    }
}

export default ChessGame;
