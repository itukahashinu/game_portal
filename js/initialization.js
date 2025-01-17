import { initializeGames } from './main.js';

console.log('Starting game initialization...');

// 非同期の初期化処理
async function initialize() {
    try {
        await initializeGames();
        console.log('Game initialization completed successfully');
    } catch (error) {
        console.error('Game initialization failed:', error);
    }
}

// DOMContentLoadedを待ってから初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initialize());
} else {
    initialize();
}
