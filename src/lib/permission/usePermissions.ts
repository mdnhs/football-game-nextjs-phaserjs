'use client';
// NOTE: project uses Firebase auth. `session`/`status` is a stub — wire to a Firebase token
// claim or custom session hook once compressed permissions are exposed client-side.
import { useMemo } from 'react';
import { createPermissionChecker, type PermissionKey, type PermissionValue } from '@/lib/permission/utils';

export function usePermissions() {
  const session: { user?: { compressedPermissions?: string } } | null = null;
  const status: 'authenticated' | 'loading' | 'unauthenticated' | null = null;

  const checker = useMemo(() => {
    const sess = session as { user?: { compressedPermissions?: string } } | null;
    if (status !== 'authenticated' || !sess?.user?.compressedPermissions) return null;
    return createPermissionChecker(sess.user.compressedPermissions);
  }, []);

  const hasPermission = (permission: PermissionValue): boolean => checker?.hasPermissionByValue(permission) ?? false;
  const hasPermissionByKey = (permissionKey: PermissionKey): boolean =>
    checker?.hasPermissionByKey(permissionKey) ?? false;
  const hasAnyPermission = (permissions: PermissionValue[]): boolean =>
    checker?.hasAnyPermissionByValues(permissions) ?? false;
  const hasAllPermissions = (permissions: PermissionValue[]): boolean =>
    checker?.hasAllPermissionsByValues(permissions) ?? false;
  const getAllPermissions = (): PermissionValue[] => checker?.getAllPermissions() ?? [];
  const getPermissionCount = (): number => checker?.getPermissionCount() ?? 0;

  return {
    hasPermission,
    hasPermissionByKey,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    getPermissionCount,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
