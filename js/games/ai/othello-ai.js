import { MinimaxAIPlayer } from '../utils/ai-player.js';

export class OthelloAI extends MinimaxAIPlayer {
    constructor(game, depth = 3) {
        super(game, depth);
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

    // 一時的に手を適用
    makeTemporaryMove(move) {
        const { row, col } = move;
        this.game.makeMove(row, col, true); // simulationモードで実行
    }

    // 一時的な手を元に戻す
    undoTemporaryMove(move) {
        this.game.undoLastMove();
    }

    // 局面の評価
    evaluatePosition() {
        // 角の重要度を高く設定
        const cornerValue = 30;
        // 角の隣は不利な位置
        const adjacentCornerValue = -10;
        // 端の価値
        const edgeValue = 5;

        let score = 0;
        const currentPlayer = this.game.currentPlayer;

        // 全マスを評価
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (!piece) continue;

                let value = 1; // 基本点
                
                // 角の判定
                if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
                    value = cornerValue;
                }
                // 角の隣の判定
                else if (
                    ((row === 0 || row === 1 || row === 6 || row === 7) &&
                     (col === 0 || col === 1 || col === 6 || col === 7))
                ) {
                    value = adjacentCornerValue;
                }
                // 端の判定
                else if (row === 0 || row === 7 || col === 0 || col === 7) {
                    value = edgeValue;
                }

                // 現在のプレイヤーの駒なら加点、相手の駒なら減点
                score += piece === currentPlayer ? value : -value;
            }
        }

        return score;
    }

    // 次の手を決定
    async makeMove() {
        const moves = this.getValidMoves();
        if (moves.length === 0) return null;

        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of moves) {
            this.makeTemporaryMove(move);
            const value = this.minimax(this.maxDepth - 1, false);
            this.undoTemporaryMove(move);

            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return bestMove;
    }
}
