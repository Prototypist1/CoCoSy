const STORAGE_KEY = 'recentGames';

export type RecentGame = {
    id: string;
    firstAccessed: number;
    topOption: string | null;
    gameName: string | null;
};

export function getRecentGames(): RecentGame[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
        return [];
    }
}

function saveRecentGames(games: RecentGame[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function touchGame(id: string) {
    const games = getRecentGames();
    if (!games.find(g => g.id === id)) {
        games.unshift({ id, firstAccessed: Date.now(), topOption: null, gameName: null });
        saveRecentGames(games);
    }
}

export function updateTopOption(id: string, topOption: string | null) {
    const games = getRecentGames();
    const entry = games.find(g => g.id === id);
    if (entry) {
        entry.topOption = topOption;
        saveRecentGames(games);
    }
}

export function removeGame(id: string) {
    saveRecentGames(getRecentGames().filter(g => g.id !== id));
}

export function updateGameName(id: string, gameName: string | null) {
    const games = getRecentGames();
    const entry = games.find(g => g.id === id);
    if (entry) {
        entry.gameName = gameName || null;
        saveRecentGames(games);
    }
}
