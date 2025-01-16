import { MinimaxAIPlayer } from '../utils/ai-player.js';

export class ChessAI extends MinimaxAIPlayer {
    constructor(game, depth = 2) {
        super(game, depth);
    }

    // 有効な手の一覧を取得
    getValidMoves() {
        const moves = [];
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.game.board[fromRow][fromCol];
                if (piece && piece.color === 'black') {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.game.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                moves.push({ fromRow, fromCol, toRow, toCol });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    // 一時的に手を適用
    makeTemporaryMove(move) {
        const { fromRow, fromCol, toRow, toCol } = move;
        this.capturedPiece = this.game.board[toRow][toCol];
        this.game.makeMove(fromRow, fromCol, toRow, toCol, true);
    }

    // 一時的な手を元に戻す
    undoTemporaryMove(move) {
        const { fromRow, fromCol, toRow, toCol } = move;
        this.game.board[fromRow][fromCol] = this.game.board[toRow][toCol];
        this.game.board[toRow][toCol] = this.capturedPiece;
    }

    // 局面の評価
    evaluatePosition() {
        let score = 0;
        const pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9,
            king: 100
        };

        // 駒の価値による評価
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece) {
                    const value = pieceValues[piece.type];
                    score += piece.color === 'black' ? value : -value;
                }
            }
        }

        // 中央支配の評価
        const centerSquares = [
            [3, 3], [3, 4],
            [4, 3], [4, 4]
        ];
        
        centerSquares.forEach(([row, col]) => {
            const piece = this.game.board[row][col];
            if (piece) {
                score += piece.color === 'black' ? 0.5 : -0.5;
            }
        });

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
