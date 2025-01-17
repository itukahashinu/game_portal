export class Othello {
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
