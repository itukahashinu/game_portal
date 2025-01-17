import { RuleBasedAIPlayer } from '../ai-player.js';

export class PokerAI extends RuleBasedAIPlayer {
    constructor(game) {
        super(game);
        this.setupRules();
    }

    setupRules() {
        // フラッシュを狙うルール
        this.addRule(
            (game) => {
                const suits = game.opponentHand.map(card => card.suit);
                const suitCounts = {};
                suits.forEach(suit => {
                    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
                });
                const maxSuitCount = Math.max(...Object.values(suitCounts));
                return maxSuitCount >= 4;
            },
            (game) => {
                const suits = game.opponentHand.map(card => card.suit);
                const suitCounts = {};
                suits.forEach(suit => {
                    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
                });
                const targetSuit = Object.entries(suitCounts)
                    .find(([suit, count]) => count >= 4)[0];
                
                return game.opponentHand
                    .map((card, index) => card.suit !== targetSuit ? index : -1)
                    .filter(index => index !== -1);
            },
            5
        );

        // ペアを維持するルール
        this.addRule(
            (game) => {
                const ranks = game.opponentHand.map(card => card.rank);
                const rankCounts = {};
                ranks.forEach(rank => {
                    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
                });
                return Object.values(rankCounts).some(count => count >= 2);
            },
            (game) => {
                const ranks = game.opponentHand.map(card => card.rank);
                const rankCounts = {};
                ranks.forEach(rank => {
                    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
                });
                
                const pairRanks = Object.entries(rankCounts)
                    .filter(([rank, count]) => count >= 2)
                    .map(([rank]) => rank);
                
                return game.opponentHand
                    .map((card, index) => !pairRanks.includes(card.rank) ? index : -1)
                    .filter(index => index !== -1);
            },
            4
        );

        // 高いカードを維持するルール
        this.addRule(
            (game) => true, // 常に適用
            (game) => {
                const highCards = ['A', 'K', 'Q', 'J', '10'];
                return game.opponentHand
                    .map((card, index) => !highCards.includes(card.rank) ? index : -1)
                    .filter(index => index !== -1);
            },
            1
        );
    }

    // ベット戦略
    decideBet(game) {
        const hand = game.opponentHand;
        const ranks = hand.map(card => card.rank);
        const suits = hand.map(card => card.suit);

        // フラッシュの可能性があれば高めにベット
        if (new Set(suits).size === 1) {
            return 20;
        }

        // ペアがあれば中程度のベット
        const rankCounts = {};
        ranks.forEach(rank => {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });
        if (Object.values(rankCounts).some(count => count >= 2)) {
            return 10;
        }

        // それ以外は最小ベット
        return 5;
    }
}
