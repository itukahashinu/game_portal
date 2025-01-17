import { loadGame as loadGameOriginal, backToMenu as backToMenuOriginal } from './main.js';

// ゲームのロード処理とメニューに戻る処理を直接エクスポート
export const loadGame = loadGameOriginal;
export const backToMenu = backToMenuOriginal;
