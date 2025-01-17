import { Game } from '../../js/main.js';
import { Chess } from '../../node_modules/chess.js/chess.js';

class ChessGame extends Game {
    initialize() {
        this.chess = new Chess();
        this.selectedSquare = null;
        this.gameInProgress = false;
        this.gameMode = null; // 'ai' or 'human'
        
        this.createBoard();
        this.setupControls();
        
        return Promise.resolve();
    }

    start() {
        this.gameInProgress = true;
        this.updateStatus();
        this.renderBoard();
    }

    createBoard() {
        const container = document.createElement('div');
        container.classList.add('chess-info');
        
        // ステータス表示
        const statusText = document.createElement('div');
        statusText.classList.add('current-player');
        this.statusText = statusText;
        container.appendChild(statusText);

        // AIレベル選択
        const aiLevelContainer = document.createElement('div');
        aiLevelContainer.classList.add('ai-level-container');
        const aiLevelSelect = document.createElement('select');
        aiLevelSelect.id = 'ai-level';
        ['初級', '中級', '上級'].forEach((level, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = level;
            aiLevelSelect.appendChild(option);
        });
        aiLevelContainer.appendChild(document.createTextNode('AIレベル: '));
        aiLevelContainer.appendChild(aiLevelSelect);
        container.appendChild(aiLevelContainer);

        // コントロールボタン
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

        // チェス盤
        const board = document.createElement('div');
        board.classList.add('chess-board');
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                const squareName = this.getSquareName(row, col);
                square.dataset.square = squareName;
                square.addEventListener('click', () => this.handleSquareClick(squareName));
                board.appendChild(square);
            }
        }
        
        this.boardElement = board;
        container.appendChild(board);
        this.container.appendChild(container);
    }

    setupControls() {
        const vsAIButton = document.getElementById('vs-ai');
        const vsHumanButton = document.getElementById('vs-human');
        const aiLevelSelect = document.getElementById('ai-level');

        vsAIButton.addEventListener('click', () => {
            this.resetGame();
            this.gameMode = 'ai';
            this.gameInProgress = true;
            this.updateStatus();
            this.renderBoard();
            
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            aiLevelSelect.disabled = true;
        });

        vsHumanButton.addEventListener('click', () => {
            this.resetGame();
            this.gameMode = 'human';
            this.gameInProgress = true;
            this.updateStatus();
            this.renderBoard();
            
            vsAIButton.disabled = true;
            vsHumanButton.disabled = true;
            aiLevelSelect.disabled = true;
        });
    }

    handleSquareClick(square) {
        if (!this.gameInProgress) return;

        if (this.selectedSquare === null) {
            // 駒の選択
            const piece = this.chess.get(square);
            if (piece && piece.color === (this.chess.turn() === 'w' ? 'w' : 'b')) {
                this.selectedSquare = square;
                this.renderBoard();
            }
        } else {
            // 駒の移動
            const move = {
                from: this.selectedSquare,
                to: square,
                promotion: 'q' // プロモーションはデフォルトでクイーン
            };

            try {
                const result = this.chess.move(move);
                if (result) {
                    this.updateStatus();
                    this.renderBoard();

                    // AIモードの場合、AI応答を実行
                    if (this.gameMode === 'ai' && this.gameInProgress) {
                        setTimeout(() => this.makeAIMove(), 500);
                    }
                }
            } catch (e) {
                console.error('Invalid move:', e);
            }

            this.selectedSquare = null;
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (!this.gameInProgress) return;

        const moves = this.chess.moves();
        if (moves.length > 0) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            this.chess.move(move);
            this.updateStatus();
            this.renderBoard();
        }
    }

    getSquareName(row, col) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[col] + ranks[row];
    }

    updateStatus() {
        let status = '';
        
        if (this.chess.isCheckmate()) {
            const winner = this.chess.turn() === 'w' ? '黒' : '白';
            status = `${winner}の勝利です！`;
            this.gameInProgress = false;
        } else if (this.chess.isDraw()) {
            status = '引き分けです';
            this.gameInProgress = false;
        } else {
            status = `現在の手番: ${this.chess.turn() === 'w' ? '白' : '黒'}`;
            if (this.chess.isCheck()) {
                status += ' (チェック)';
            }
        }
        
        this.statusText.textContent = status;
    }

    renderBoard() {
        const squares = this.boardElement.getElementsByClassName('square');
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = squares[row * 8 + col];
                const squareName = this.getSquareName(row, col);
                const piece = this.chess.get(squareName);
                
                // マスのクリア
                square.innerHTML = '';
                square.classList.remove('selected', 'valid-move', 'last-move', 'check');
                
                // 駒の表示
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
                    pieceElement.innerHTML = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }

                // 選択中の駒とその移動可能マスのハイライト
                if (this.selectedSquare === squareName) {
                    square.classList.add('selected');
                } else if (this.selectedSquare) {
                    const moves = this.chess.moves({ 
                        square: this.selectedSquare,
                        verbose: true
                    });
                    if (moves.some(m => m.to === squareName)) {
                        square.classList.add('valid-move');
                    }
                }

                // チェック状態のハイライト
                if (piece && piece.type === 'k' && this.chess.isCheck()) {
                    if ((this.chess.turn() === 'w' && piece.color === 'w') ||
                        (this.chess.turn() === 'b' && piece.color === 'b')) {
                        square.classList.add('check');
                    }
                }
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            k: '♔',
            q: '♕',
            r: '♖',
            b: '♗',
            n: '♘',
            p: '♙'
        };
        return symbols[piece.type];
    }

    resetGame() {
        this.chess.reset();
        this.selectedSquare = null;
        this.renderBoard();
        this.updateStatus();
    }

    cleanup() {
        this.container.innerHTML = '';
    }
}

export default ChessGame;
