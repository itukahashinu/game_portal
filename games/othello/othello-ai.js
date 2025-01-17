export class OthelloAI {
    constructor(game, depth = 3) {
        this.game = game;
        this.maxDepth = depth;
    }

    // 有効な手の一覧を取得
    getValidMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.game.isValidMove(row, col)) {
                    moves.push({ row, col });
                }
            }
        }
        return moves;
    }

    // 局面の評価
    evaluatePosition() {
        const cornerValue = 30;
        const adjacentCornerValue = -10;
        const edgeValue = 5;

        let score = 0;
        const currentPlayer = this.game.currentPlayer;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (!piece) continue;

                let value = 1;
                if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
                    value = cornerValue;
                } else if ((row === 0 || row === 1 || row === 6 || row === 7) && 
                          (col === 0 || col === 1 || col === 6 || col === 7)) {
                    value = adjacentCornerValue;
                } else if (row === 0 || row === 7 || col === 0 || col === 7) {
                    value = edgeValue;
                }

                score += piece === currentPlayer ? value : -value;
            }
        }
        return score;
    }

    // AIの手を決定
    makeMove() {
        const moves = this.getValidMoves();
        
        if (moves.length === 0) {
            return null;
        }

        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of moves) {
            // 一時的に手を適用
            this.game.makeMove(move.row, move.col, true);
            const value = this.minimax(this.maxDepth - 1, false, -Infinity, Infinity);
            this.game.undoLastMove();

            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        if (bestMove) {
            // 実際の手を適用
            this.game.makeMove(bestMove.row, bestMove.col, false);
        }

        return bestMove;
    }

    // minimaxアルゴリズム
    minimax(depth, isMaximizing, alpha, beta) {
        if (depth === 0) {
            return this.evaluatePosition();
        }

        const moves = this.getValidMoves();
        
        if (moves.length === 0) {
            return this.evaluatePosition();
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                this.game.makeMove(move.row, move.col, true);
                const evaluation = this.minimax(depth - 1, false, alpha, beta);
                this.game.undoLastMove();
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.game.makeMove(move.row, move.col, true);
                const evaluation = this.minimax(depth - 1, true, alpha, beta);
                this.game.undoLastMove();
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
}
