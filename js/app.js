import { loadGame, backToMenu } from './main.js';

// グローバルに関数を公開
window.loadGame = (name) => {
    loadGame(name).catch(error => {
        console.error('Failed to load game:', error);
    });
};

window.backToMenu = () => {
    backToMenu();
};
