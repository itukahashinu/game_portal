// AIプレイヤーの基本クラス
export class AIPlayer {
    constructor(game) {
        this.game = game;
    }

    // 次の手を決定する（各ゲームで実装）
    async makeMove() {
        throw new Error('makeMove() must be implemented');
    }

    // 利用可能な手を評価する（各ゲームで実装）
    evaluateMove(move) {
        throw new Error('evaluateMove() must be implemented');
    }
}

// ミニマックスアルゴリズムを使用するAI
export class MinimaxAIPlayer extends AIPlayer {
    constructor(game, depth = 3) {
        super(game);
        this.maxDepth = depth;
    }

    // ミニマックスアルゴリズムのメイン実装
    async minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        if (depth === 0) {
            return await this.evaluatePosition();
        }

        const moves = await this.getValidMoves();
        
        if (moves.length === 0) {
            return await this.evaluatePosition();
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                await this.makeTemporaryMove(move);
                const evaluation = await this.minimax(depth - 1, false, alpha, beta);
                await this.undoTemporaryMove(move);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                await this.makeTemporaryMove(move);
                const evaluation = await this.minimax(depth - 1, true, alpha, beta);
                await this.undoTemporaryMove(move);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    // AIの状態を取得
    getState() {
        return {
            isThinking: false,
            lastMove: null
        };
    }

    // AIの状態を設定
    setState(state) {
        Object.assign(this, state);
    }

    // 現在の局面を評価（各ゲームで実装）
    evaluatePosition() {
        throw new Error('evaluatePosition() must be implemented');
    }

    // 有効な手を取得（各ゲームで実装）
    getValidMoves() {
        throw new Error('getValidMoves() must be implemented');
    }

    // 一時的に手を適用（各ゲームで実装）
    makeTemporaryMove(move) {
        throw new Error('makeTemporaryMove() must be implemented');
    }

    // 一時的な手を元に戻す（各ゲームで実装）
    undoTemporaryMove(move) {
        throw new Error('undoTemporaryMove() must be implemented');
    }
}

// モンテカルロ木探索を使用するAI
export class MCTSAIPlayer extends AIPlayer {
    constructor(game, simulations = 1000) {
        super(game);
        this.numSimulations = simulations;
    }

    // モンテカルロ木探索のメイン実装
    async makeMove() {
        const moves = this.getValidMoves();
        if (moves.length === 0) return null;

        const results = moves.map(move => {
            let wins = 0;
            for (let i = 0; i < this.numSimulations; i++) {
                this.makeTemporaryMove(move);
                const result = this.simulateRandomGame();
                this.undoTemporaryMove(move);
                if (result > 0) wins++;
            }
            return { move, score: wins / this.numSimulations };
        });

        return results.reduce((best, current) => 
            current.score > best.score ? current : best
        ).move;
    }

    // ランダムなゲームをシミュレート（各ゲームで実装）
    simulateRandomGame() {
        throw new Error('simulateRandomGame() must be implemented');
    }

    // 有効な手を取得（各ゲームで実装）
    getValidMoves() {
        throw new Error('getValidMoves() must be implemented');
    }

    // 一時的に手を適用（各ゲームで実装）
    makeTemporaryMove(move) {
        throw new Error('makeTemporaryMove() must be implemented');
    }

    // 一時的な手を元に戻す（各ゲームで実装）
    undoTemporaryMove(move) {
        throw new Error('undoTemporaryMove() must be implemented');
    }
}

// 簡単なルールベースAI
export class RuleBasedAIPlayer extends AIPlayer {
    constructor(game) {
        super(game);
        this.rules = [];
    }

    // ルールを追加
    addRule(condition, action, priority = 1) {
        this.rules.push({ condition, action, priority });
        // 優先度順にソート
        this.rules.sort((a, b) => b.priority - a.priority);
    }

    // ルールに基づいて次の手を決定
    async makeMove() {
        for (const rule of this.rules) {
            if (rule.condition(this.game)) {
                return rule.action(this.game);
            }
        }
        return this.makeRandomMove();
    }

    // ランダムな手を選択（各ゲームで実装）
    makeRandomMove() {
        throw new Error('makeRandomMove() must be implemented');
    }
}
