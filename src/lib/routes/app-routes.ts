export const APP_ROUTES = {
  auth: {
    login: '/auth',
    adminLogin: '/admin-panel/login',
  },
  game: {
    menu: '/menu',
    game: '/game',
    result: '/result',
    leaderboard: '/leaderboard',
    profile: '/profile',
  },
  admin: {
    root: '/admin-panel',
    dashboard: '/admin-panel/dashboard',
    players: '/admin-panel/players',
    scores: '/admin-panel/scores',
    flaggedScores: '/admin-panel/scores/flagged',
    winners: '/admin-panel/winners',
    settings: '/admin-panel/settings',
    qr: '/admin-panel/qr',
    qrDetail: (id: string) => `/admin-panel/qr/${id}`,
  },
} as const;
