'use client';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { createPermissionChecker, type PermissionKey, type PermissionValue } from '@/lib/permission/utils';

export function usePermissions() {
  const { data: session, status } = useSession();

  const checker = useMemo(() => {
    const permissions = session?.user?.compressedPermissions;
    if (status !== 'authenticated' || !permissions) return null;
    return createPermissionChecker(permissions);
  }, [session?.user?.compressedPermissions, status]);

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
