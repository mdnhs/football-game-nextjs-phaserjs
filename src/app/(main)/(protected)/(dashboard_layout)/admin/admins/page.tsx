'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/features/admin/services/api';
import { fmtDate } from '@/features/admin/utils/format';
import type { AdminUser, Role } from '@/features/admin/types';
import { toast } from 'sonner';
import {
  UserCog,
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Loader2,
  UserPlus,
  Save,
  Mail,
  KeyRound,
  X,
} from 'lucide-react';
import { ClientPermissionGate } from '@/lib/permission/client-permission-gate';

export default function AdminsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const selfId = session?.user?.id;

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: () => api<AdminUser[]>('/api/admin/rbac/admins'),
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api<Role[]>('/api/admin/rbac/roles'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-admins'] });

  const summary = useMemo(() => {
    const rows = admins ?? [];
    return {
      total: rows.length,
      active: rows.filter((a) => a.is_active).length,
      disabled: rows.filter((a) => !a.is_active).length,
    };
  }, [admins]);

  return (
    <AdminShell title='Admins' requirePermissions={['admin.admin.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-indigo-500/10 via-transparent to-emerald-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <UserCog className='h-3 w-3 text-indigo-500' />
                Team
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Admin Users</h1>
              <p className='text-muted-foreground mt-1 text-sm'>Invite teammates, assign roles, deactivate access.</p>
            </div>
            <ClientPermissionGate permissions={['admin.admin.create']}>
              <Button onClick={() => setCreateOpen(true)} className='gap-2'>
                <UserPlus className='h-4 w-4' />
                New admin
              </Button>
            </ClientPermissionGate>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MiniStat
            label='Total Admins'
            value={summary.total}
            icon={UserCog}
            color='text-indigo-500'
            ring='ring-indigo-500/20'
            loading={adminsLoading}
          />
          <MiniStat
            label='Active'
            value={summary.active}
            icon={ShieldCheck}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={adminsLoading}
          />
          <MiniStat
            label='Disabled'
            value={summary.disabled}
            icon={ShieldAlert}
            color='text-red-500'
            ring='ring-red-500/20'
            loading={adminsLoading}
          />
        </div>

        <Card className='overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-muted/30 border-b px-6 py-4'>
            <CardTitle className='text-lg'>All Admins</CardTitle>
            <CardDescription>You cannot deactivate or delete your own account.</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            {adminsLoading || rolesLoading ? (
              <div className='space-y-3 p-6'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (admins?.length ?? 0) === 0 ? (
              <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
                <div className='bg-muted rounded-full p-4'>
                  <UserCog className='text-muted-foreground h-8 w-8' />
                </div>
                <div className='text-muted-foreground text-sm'>No admins yet.</div>
              </div>
            ) : (
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className='pr-6 text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(admins ?? []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{a.email}</span>
                          {a.id === selfId && (
                            <Badge variant='secondary' className='text-[10px]'>
                              you
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='font-mono text-xs'>
                          {a.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.is_active ? (
                          <Badge className='gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'>
                            <ShieldCheck className='h-3 w-3' />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant='destructive' className='gap-1'>
                            <ShieldAlert className='h-3 w-3' />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {a.last_login_at ? fmtDate(a.last_login_at) : '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>{fmtDate(a.created_at)}</TableCell>
                      <TableCell className='pr-6 text-right'>
                        <RowActions
                          isSelf={a.id === selfId}
                          onEdit={() => setEditing(a)}
                          onDelete={() => setDeleteTarget(a)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} roles={roles ?? []} onCreated={refresh} />
      <EditAdminDialog
        key={editing?.id ?? 'none'}
        admin={editing}
        isSelf={editing?.id === selfId}
        roles={roles ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
      <DeleteAdminDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={refresh} />
    </AdminShell>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
  ring,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  ring: string;
  loading?: boolean;
}) {
  return (
    <Card className='border-none shadow-sm'>
      <CardContent className='flex items-center justify-between p-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</span>
          {loading ? (
            <Skeleton className='h-7 w-12' />
          ) : (
            <span className='text-2xl font-bold tabular-nums'>{value}</span>
          )}
        </div>
        <div className={`bg-background rounded-lg p-2 ring-1 ${ring}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function RowActions({ isSelf, onEdit, onDelete }: { isSelf: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        }
      />
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <ClientPermissionGate permissions={['admin.admin.edit']}>
            <DropdownMenuItem onClick={onEdit}>Edit admin</DropdownMenuItem>
          </ClientPermissionGate>
          <ClientPermissionGate permissions={['admin.admin.delete']}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSelf}
              onClick={onDelete}
              className='text-destructive'
              title={isSelf ? 'You cannot delete your own account' : 'Delete admin'}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete admin
            </DropdownMenuItem>
          </ClientPermissionGate>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateAdminDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roles: Role[];
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api<AdminUser>('/api/admin/rbac/admins', {
        method: 'POST',
        body: { email: email.trim(), password, roleId },
      }),
    onSuccess: () => {
      toast.success(`Admin ${email} created`);
      setEmail('');
      setPassword('');
      setRoleId('');
      onCreated();
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Create failed'),
  });

  const canSubmit = email.trim().length > 0 && password.length >= 8 && roleId && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5 text-indigo-500' />
            New admin
          </DialogTitle>
          <DialogDescription>Provision a new admin account.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='new-email'>Email</Label>
            <div className='relative'>
              <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                id='new-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='teammate@example.com'
                className='pl-10'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-password'>Initial password</Label>
            <div className='relative'>
              <KeyRound className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                id='new-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Minimum 8 characters'
                className='pl-10'
              />
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className='text-destructive text-xs'>At least 8 characters.</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-role'>Role</Label>
            <Select value={roleId} onValueChange={(v) => setRoleId(v ?? '')}>
              <SelectTrigger id='new-role' className='w-full'>
                <SelectValue placeholder='Select a role'>
                  {(value) => {
                    const r = roles.find((x) => x.id === value);
                    if (!r) return 'Select a role';
                    return (
                      <span className='flex items-center gap-2'>
                        <span className='font-mono'>{r.name}</span>
                        <span className='text-muted-foreground text-xs'>({r.permissions.length} perms)</span>
                      </span>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className='font-mono'>{r.name}</span>
                    <span className='text-muted-foreground ml-2 text-xs'>({r.permissions.length} perms)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Create admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAdminDialog({
  admin,
  isSelf,
  roles,
  onClose,
  onSaved,
}: {
  admin: AdminUser | null;
  isSelf: boolean;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(admin?.email ?? '');
  const [roleId, setRoleId] = useState(admin?.role_id ?? '');
  const [isActive, setIsActive] = useState(admin?.is_active ?? true);
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {};
      if (email !== admin!.email) body.email = email;
      if (roleId !== admin!.role_id) body.roleId = roleId;
      if (isActive !== admin!.is_active) body.isActive = isActive;
      if (password.trim().length >= 8) body.password = password;
      return api<AdminUser>(`/api/admin/rbac/admins/${admin!.id}`, { method: 'PATCH', body });
    },
    onSuccess: () => {
      toast.success('Admin updated');
      onSaved();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  if (!admin) return null;

  const dirty =
    email !== admin.email || roleId !== admin.role_id || isActive !== admin.is_active || password.trim().length >= 8;

  return (
    <Dialog open={!!admin} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserCog className='h-5 w-5 text-indigo-500' />
            Edit admin
          </DialogTitle>
          <DialogDescription>{admin.email}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='edit-email'>Email</Label>
            <Input id='edit-email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-role'>Role</Label>
            <Select value={roleId} onValueChange={(v) => setRoleId(v ?? '')}>
              <SelectTrigger id='edit-role' className='w-full'>
                <SelectValue placeholder='Select role'>
                  {(value) => {
                    const r = roles.find((x) => x.id === value);
                    if (!r) return 'Select role';
                    return (
                      <span className='flex items-center gap-2'>
                        <span className='font-mono'>{r.name}</span>
                        <span className='text-muted-foreground text-xs'>({r.permissions.length} perms)</span>
                      </span>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className='font-mono'>{r.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-password'>New password (optional)</Label>
            <Input
              id='edit-password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Leave blank to keep current'
            />
            {password.length > 0 && password.length < 8 && (
              <p className='text-destructive text-xs'>At least 8 characters.</p>
            )}
          </div>
          <div className='bg-muted/40 flex items-center justify-between rounded-lg border p-3'>
            <div>
              <Label htmlFor='edit-active' className='text-sm font-medium'>
                Active
              </Label>
              <p className='text-muted-foreground text-xs'>Disabled accounts cannot log in.</p>
            </div>
            <input
              id='edit-active'
              type='checkbox'
              checked={isActive}
              disabled={isSelf}
              onChange={(e) => setIsActive(e.target.checked)}
              className='h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
            />
          </div>
          {isSelf && <p className='text-muted-foreground text-xs'>You cannot deactivate yourself.</p>}
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!dirty || mutation.isPending} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAdminDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: AdminUser | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/rbac/admins/${target!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`Admin ${target?.email} deleted`);
      onDeleted();
      onClose();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
  });

  if (!target) return null;
  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trash2 className='text-destructive h-5 w-5' />
            Delete admin
          </DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{target.email}</strong>? Their access will be revoked immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            <X className='mr-2 h-4 w-4' />
            Cancel
          </Button>
          <Button variant='destructive' onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Trash2 className='mr-2 h-4 w-4' />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
