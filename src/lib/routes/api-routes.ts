export const API_ROUTES = {
  auth: {
    sendOtp: '/api/auth/otp/send',
    verifyOtp: '/api/auth/verify-otp',
    completeProfile: '/api/auth/complete-profile',
    login: '/api/login',
    logout: '/api/logout',
    me: '/api/me',
  },
  player: {
    me: '/api/players/me',
    playsRemaining: '/api/players/me/plays-remaining',
    difficulty: '/api/player/difficulty',
  },
  score: {
    create: '/api/scores',
  },
  leaderboard: {
    daily: '/api/leaderboard/daily',
    campaign: '/api/leaderboard/campaign',
    myRank: '/api/leaderboard/my-rank',
  },
  admin: {
    players: '/api/admin/players',
    scores: '/api/admin/scores',
    flaggedScores: '/api/admin/scores/flagged',
    winners: '/api/admin/winners',
    settings: '/api/admin/settings',
    qr: '/api/admin/qr',
    qrDetail: (id: string) => `/api/admin/qr/${id}`,
  },
} as const;
