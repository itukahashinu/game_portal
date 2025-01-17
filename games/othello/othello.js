import { MinimaxAIPlayer } from '../ai-player.js';

export class OthelloAI extends MinimaxAIPlayer {
    constructor(game, depth = 3) {
        super(game, depth);
    }

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

    makeTemporaryMove(move) {
        const { row, col } = move;
        this.game.makeMove(row, col, true);
    }

    undoTemporaryMove() {
        this.game.undoLastMove();
    }

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
                } else if ((row === 0 || row === 1 || row === 6 || row === 7) && (col === 0 || col === 1 || col === 6 || col === 7)) {
                    value = adjacentCornerValue;
                } else if (row === 0 || row === 7 || col === 0 || col === 7) {
                    value = edgeValue;
                }

                score += piece === currentPlayer ? value : -value;
            }
        }
        return score;
    }
}
