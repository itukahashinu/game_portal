import { loadGame as loadGameOriginal, backToMenu as backToMenuOriginal } from './main.js';

// ゲームのロード処理
const loadGame = async (name) => {
    try {
        await loadGameOriginal(name);
    } catch (error) {
        console.error('Failed to load game:', error);
    }
};

// メニューに戻る処理
const backToMenu = () => {
    try {
        backToMenuOriginal();
    } catch (error) {
        console.error('Failed to return to menu:', error);
    }
};

export { loadGame, backToMenu };
