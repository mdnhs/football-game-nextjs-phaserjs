import { type PermissionValue } from '@/lib/permission/utils';
import { getServerPermissionChecker } from '@/lib/permission/server-utils';

interface PermissionGateProps {
  permissions: PermissionValue[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export async function PermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const checker = await getServerPermissionChecker();
  if (!checker) return <>{fallback}</>;
  const hasAccess = requireAll
    ? checker.hasAllPermissionsByValues(permissions)
    : checker.hasAnyPermissionByValues(permissions);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
