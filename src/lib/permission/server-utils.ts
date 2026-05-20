import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/admin-session';
import { ROUTE_PERMISSIONS } from '@/lib/permission/route-permissions';
import {
  type CompressedPermissions,
  createPermissionChecker,
  decompressPermissions,
  type PermissionChecker,
  type PermissionValue,
} from './utils';

export const getCompressedPermissionsFromSession = async (): Promise<CompressedPermissions | null> => {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.compressedPermissions || null;
  } catch {
    return null;
  }
};

export const getServerPermissionChecker = async (): Promise<PermissionChecker | null> => {
  const compressedPermissions = await getCompressedPermissionsFromSession();
  return compressedPermissions ? createPermissionChecker(compressedPermissions) : null;
};

export const getDecompressedPermissions = async (): Promise<PermissionValue[]> => {
  const compressedPermissions = await getCompressedPermissionsFromSession();
  return compressedPermissions ? decompressPermissions(compressedPermissions) : [];
};

export function getRequiredPermissions(pathname: string): PermissionValue[] {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchesPattern(pathname, routePattern)) return permissions;
  }
  return [];
}

function matchesPattern(pathname: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

export const validateRouteAccess = (compressedPermissions: CompressedPermissions, pathname: string): boolean => {
  const trimmedPathname = pathname.split('?')[0];
  const requiredPermissions = getRequiredPermissions(trimmedPathname);
  if (requiredPermissions.length === 0) return true;
  const checker = createPermissionChecker(compressedPermissions);
  return checker.hasAnyPermissionByValues(requiredPermissions);
};
