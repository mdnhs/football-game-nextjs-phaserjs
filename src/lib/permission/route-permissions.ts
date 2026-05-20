import { PERMISSIONS } from './permissions';

type PermissionKey = keyof typeof PERMISSIONS;
type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
type RoutePermissionConfig = Record<string, PermissionValue[]>;

export const ROUTE_PERMISSIONS: RoutePermissionConfig = {
  '/admin-panel/dashboard': ['admin.dashboard.view'],
  '/admin-panel/players': ['admin.player.view_list'],
  '/admin-panel/scores': ['admin.score.view_list'],
  '/admin-panel/scores/flagged': ['admin.score.flag'],
  '/admin-panel/winners': ['admin.winner.view_list'],
  '/admin-panel/qr': ['admin.qr.view_list'],
  '/admin-panel/qr/:id': ['admin.qr.view_list'],
  '/admin-panel/settings': ['admin.settings.view'],
};
