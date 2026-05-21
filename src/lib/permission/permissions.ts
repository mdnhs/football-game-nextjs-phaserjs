// Project-specific permissions. Pattern: KEY: 'module.resource.action'
// MUST stay in sync with backend ADMIN_PERMISSIONS in
// football-game-api/src/modules/adminAuth/admin-auth.schema.ts
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
  // RBAC
  ADMIN_RBAC_VIEW: 'admin.rbac.view',
  ADMIN_RBAC_MANAGE: 'admin.rbac.manage',
  ADMIN_ADMIN_VIEW_LIST: 'admin.admin.view_list',
  ADMIN_ADMIN_CREATE: 'admin.admin.create',
  ADMIN_ADMIN_EDIT: 'admin.admin.edit',
  ADMIN_ADMIN_DELETE: 'admin.admin.delete',
  // ADS
  ADMIN_AD_VIEW_LIST: 'admin.ad.view_list',
  ADMIN_AD_CREATE: 'admin.ad.create',
  ADMIN_AD_EDIT: 'admin.ad.edit',
  ADMIN_AD_DELETE: 'admin.ad.delete',
} as const;
