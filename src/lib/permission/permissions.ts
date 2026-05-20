// Project-specific permissions. Pattern: KEY: 'module.resource.action'
export const PERMISSIONS = {
  // ADMIN PANEL
  ADMIN_DASHBOARD_VIEW: 'admin.dashboard.view',
  ADMIN_PLAYER_VIEW_LIST: 'admin.player.view_list',
  ADMIN_PLAYER_EDIT: 'admin.player.edit',
  ADMIN_PLAYER_DISABLE: 'admin.player.disable',
  ADMIN_SCORE_VIEW_LIST: 'admin.score.view_list',
  ADMIN_SCORE_FLAG: 'admin.score.flag',
  ADMIN_WINNER_VIEW_LIST: 'admin.winner.view_list',
  ADMIN_WINNER_DECLARE: 'admin.winner.declare',
  ADMIN_QR_VIEW_LIST: 'admin.qr.view_list',
  ADMIN_QR_CREATE: 'admin.qr.create',
  ADMIN_SETTINGS_VIEW: 'admin.settings.view',
  ADMIN_SETTINGS_EDIT: 'admin.settings.edit',
} as const;
