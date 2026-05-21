export const APP_ROUTES = {
  auth: {
    login: '/auth',
    adminLogin: '/admin/login',
  },
  game: {
    menu: '/menu',
    game: '/game',
    result: '/result',
    leaderboard: '/leaderboard',
    profile: '/profile',
  },
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    players: '/admin/players',
    scores: '/admin/scores',
    flaggedScores: '/admin/scores/flagged',
    winners: '/admin/winners',
    settings: '/admin/settings',
    qr: '/admin/qr',
    qrDetail: (id: string) => `/admin/qr/${id}`,
  },
} as const;
