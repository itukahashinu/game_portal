import { Game } from '../../js/main.js';

class OthelloGame extends Game {
    initialize() {
        this.game = new Othello();
        this.createBoard();
        return Promise.resolve();
    }

    start() {
        this.addEventListeners();
    }

    cleanup() {
        this.removeEventListeners();
        this.container.innerHTML = '';
    }

    createBoard() {
        const container = document.createElement('div');
        container.classList.add('othello-info');
        
        const statusText = document.createElement('div');
        statusText.textContent = '黒の番です';
        this.statusText = statusText;
        container.appendChild(statusText);

        const board = document.createElement('div');
        board.classList.add('othello-board');
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.classList.add('square');
                cell.dataset.row = i;
                cell.dataset.col = j;
                board.appendChild(cell);
            }
        }
        
        this.board = board;
        container.appendChild(board);
        this.container.appendChild(container);
        this.updateBoard();
    }

    updateBoard() {
        const state = this.game.getState();
        const cells = this.board.querySelectorAll('.square');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = state.board[row][col];
            
            cell.innerHTML = '';
            if (value) {
                const disc = document.createElement('div');
                disc.classList.add('piece', value === 1 ? 'black' : 'white');
                cell.appendChild(disc);
            }
        });
        this.updateStatus();
    }

    updateStatus() {
        const state = this.game.getState();
        const counts = this.getCounts();
        this.statusText.textContent = `${state.currentPlayer === 1 ? '黒' : '白'}の番です (黒: ${counts.black}個, 白: ${counts.white}個)`;
    }

    getCounts() {
        const state = this.game.getState();
        let black = 0, white = 0;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (state.board[i][j] === 1) black++;
                else if (state.board[i][j] === 2) white++;
            }
        }
        
        return { black, white };
    }

    addEventListeners() {
        this.clickHandler = this.handleClick.bind(this);
        this.board.addEventListener('click', this.clickHandler);
    }

    removeEventListeners() {
        if (this.clickHandler) {
            this.board.removeEventListener('click', this.clickHandler);
        }
    }

    handleClick(event) {
        const cell = event.target.closest('.square');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.game.makeMove(row, col)) {
            this.updateBoard();
            
            if (this.game.isGameOver()) {
                const counts = this.getCounts();
                alert(`ゲーム終了！\n黒: ${counts.black}個\n白: ${counts.white}個\n${counts.black > counts.white ? '黒の勝ち！' : counts.black < counts.white ? '白の勝ち！' : '引き分け！'}`);
            }
        }
    }
}

export default OthelloGame;

class Othello {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 1;  // 1: 黒, 2: 白
        this.moveHistory = [];
        
        // 初期配置
        this.board[3][3] = 2;
        this.board[3][4] = 1;
        this.board[4][3] = 1;
        this.board[4][4] = 2;
    }

    // 指定位置に置けるかどうかを判定
    isValidMove(row, col) {
        if (this.board[row][col]) return false;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dx, dy] of directions) {
            if (this.wouldFlip(row, col, dx, dy)) {
                return true;
            }
        }
        return false;
    }

    // 指定方向に駒を裏返せるかチェック
    wouldFlip(row, col, dx, dy) {
        let x = row + dx;
        let y = col + dy;
        let flips = [];

        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (!this.board[x][y]) return false;
            if (this.board[x][y] === this.currentPlayer) {
                return flips.length > 0;
            }
            flips.push([x, y]);
            x += dx;
            y += dy;
        }
        return false;
    }

    // 実際に駒を置く
    makeMove(row, col, isSimulation = false) {
        if (!this.isValidMove(row, col)) return false;

        const flips = this.getFlips(row, col);
        const moveData = {
            row,
            col,
            player: this.currentPlayer,
            flips: flips
        };

        this.board[row][col] = this.currentPlayer;
        
        // 駒を裏返す
        for (const [x, y] of flips) {
            this.board[x][y] = this.currentPlayer;
        }

        if (!isSimulation) {
            this.moveHistory.push(moveData);
            this.switchPlayer();
        }

        return true;
    }

    // 裏返す駒の位置を取得
    getFlips(row, col) {
        const flips = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dx, dy] of directions) {
            this.getFlipsInDirection(row, col, dx, dy, flips);
        }
        return flips;
    }

    // 特定の方向の裏返す駒を取得
    getFlipsInDirection(row, col, dx, dy, flips) {
        let x = row + dx;
        let y = col + dy;
        const temp = [];

        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (!this.board[x][y]) return;
            if (this.board[x][y] === this.currentPlayer) {
                flips.push(...temp);
                return;
            }
            temp.push([x, y]);
            x += dx;
            y += dy;
        }
    }

    // 最後の手を取り消す
    undoLastMove() {
        const lastMove = this.moveHistory.pop();
        if (!lastMove) return;

        this.board[lastMove.row][lastMove.col] = null;
        for (const [x, y] of lastMove.flips) {
            this.board[x][y] = this.currentPlayer;
        }
        this.currentPlayer = lastMove.player;
    }

    // プレイヤーを切り替え
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    // 有効な手があるかチェック
    hasValidMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }

    // ゲーム終了判定
    isGameOver() {
        // 両プレイヤーが続けて手を打てない場合
        const currentPlayerHasMoves = this.hasValidMoves();
        if (currentPlayerHasMoves) return false;

        this.switchPlayer();
        const otherPlayerHasMoves = this.hasValidMoves();
        this.switchPlayer();

        return !otherPlayerHasMoves;
    }

    // 現在の盤面状態を取得
    getState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            isGameOver: this.isGameOver()
        };
    }
}
