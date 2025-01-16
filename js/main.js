// ゲームのインターフェース定義
export class Game {
    constructor(container) {
        this.container = container;
    }
    
    initialize() {
        throw new Error('initialize() must be implemented');
    }
    
    start() {
        throw new Error('start() must be implemented');
    }
    
    cleanup() {
        throw new Error('cleanup() must be implemented');
    }
}

// ゲーム管理クラス
class GameManager {
    constructor() {
        this.currentGame = null;
        this.gameContainer = document.getElementById('game-container');
        this.gameArea = document.getElementById('game-area');
        this.games = {};
    }

    async registerGame(name, gameModulePath) {
        try {
            const gameModule = await import(gameModulePath);
            this.games[name] = gameModule.default;
        } catch (error) {
            console.error(`Failed to load game: ${name}`, error);
        }
    }

    async loadGame(name) {
        if (this.currentGame) {
            this.currentGame.cleanup();
        }

        this.gameArea.innerHTML = '';
        
        if (!this.games[name]) {
            console.error(`Game ${name} not found`);
            return;
        }

        this.gameContainer.classList.remove('hidden');
        this.currentGame = new this.games[name](this.gameArea);
        await this.currentGame.initialize();
        this.currentGame.start();
    }

    backToMenu() {
        if (this.currentGame) {
            this.currentGame.cleanup();
            this.currentGame = null;
        }
        this.gameContainer.classList.add('hidden');
    }
}

// グローバルなGameManagerインスタンスを作成
const gameManager = new GameManager();

// ゲームの初期化
async function initializeGames() {
    await gameManager.registerGame('othello', '/js/games/othello.js');
    await gameManager.registerGame('chess', '/js/games/chess.js');
    await gameManager.registerGame('poker', '/js/games/poker.js');
    await gameManager.registerGame('mahjong', '/js/games/mahjong.js');
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    initializeGames().catch(console.error);
});

// エクスポートする関数
export const loadGame = async (name) => {
    await gameManager.loadGame(name);
};

export const backToMenu = () => {
    gameManager.backToMenu();
};
