import { PERMISSIONS } from './permissions';

type PermissionKey = keyof typeof PERMISSIONS;
type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
type RoutePermissionConfig = Record<string, PermissionValue[]>;

export const ROUTE_PERMISSIONS: RoutePermissionConfig = {
  '/admin/dashboard': ['admin.dashboard.view'],
  '/admin/players': ['admin.player.view_list'],
  '/admin/scores': ['admin.score.view_list'],
  '/admin/scores/flagged': ['admin.score.flag'],
  '/admin/winners': ['admin.winner.view_list'],
  '/admin/qr': ['admin.qr.view_list'],
  '/admin/qr/:id': ['admin.qr.view_list'],
  '/admin/settings': ['admin.settings.view'],
  '/admin/roles': ['admin.rbac.view'],
  '/admin/admins': ['admin.admin.view_list'],
  '/admin/ads': ['admin.ad.view_list'],
};
