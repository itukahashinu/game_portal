export class MinimaxAIPlayer {
    constructor(game, depth = 2) {
        this.game = game;
        this.maxDepth = depth;
        this.isThinking = false;
    }

    // AIの状態を返す
    getState() {
        return {
            isThinking: this.isThinking
        };
    }

    // ミニマックスアルゴリズムの実装
    minimax(depth, isMaximizing) {
        if (depth === 0) {
            return this.evaluatePosition();
        }

        const moves = this.getValidMoves();
        if (moves.length === 0) {
            return isMaximizing ? -Infinity : Infinity;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                this.makeTemporaryMove(move);
                const evaluation = this.minimax(depth - 1, false);
                this.undoTemporaryMove(move);
                maxEval = Math.max(maxEval, evaluation);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.makeTemporaryMove(move);
                const evaluation = this.minimax(depth - 1, true);
                this.undoTemporaryMove(move);
                minEval = Math.min(minEval, evaluation);
            }
            return minEval;
        }
    }

    // 以下のメソッドはゲーム固有の実装が必要
    getValidMoves() {
        throw new Error('getValidMoves() must be implemented');
    }

    makeTemporaryMove(move) {
        throw new Error('makeTemporaryMove() must be implemented');
    }

    undoTemporaryMove(move) {
        throw new Error('undoTemporaryMove() must be implemented');
    }

    evaluatePosition() {
        throw new Error('evaluatePosition() must be implemented');
    }
}
