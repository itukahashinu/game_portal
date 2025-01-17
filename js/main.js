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
            console.log(`Loading game module: ${gameModulePath}`);
            const gameModule = await import(gameModulePath);
            if (!gameModule.default) {
                throw new Error(`Game module ${name} does not have a default export`);
            }
            this.games[name] = gameModule.default;
            console.log(`Successfully registered game: ${name}`);
        } catch (error) {
            console.error(`Failed to load game: ${name}`, error);
            throw error; // エラーを上位に伝播
        }
    }

    async loadGame(name) {
        console.log(`Attempting to load game: ${name}`);
        if (this.currentGame) {
            console.log('Cleaning up current game');
            this.currentGame.cleanup();
        }

        this.gameArea.innerHTML = '';
        
        if (!this.games[name]) {
            const error = new Error(`Game ${name} not found`);
            console.error(error);
            throw error;
        }

        try {
            console.log(`Initializing game: ${name}`);
            this.gameContainer.classList.remove('hidden');
            this.currentGame = new this.games[name](this.gameArea);
            await this.currentGame.initialize();
            this.currentGame.start();
            console.log(`Game ${name} started successfully`);
        } catch (error) {
            console.error(`Failed to initialize game: ${name}`, error);
            this.gameContainer.classList.add('hidden');
            throw error;
        }
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
    await gameManager.registerGame('othello', './games/othello.js');
    await gameManager.registerGame('chess', './games/chess.js');
    await gameManager.registerGame('poker', './games/poker.js');
    await gameManager.registerGame('mahjong', './games/mahjong.js');
}

// エクスポート
export { initializeGames };

export const loadGame = async (name) => {
    await gameManager.loadGame(name);
};

export const backToMenu = () => {
    gameManager.backToMenu();
};
