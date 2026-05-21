'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/features/admin/services/api';
import type { Role } from '@/features/admin/types';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Lock, Trash2, Edit, Loader2, Sparkles, Save, X, Check, KeyRound } from 'lucide-react';
import { ClientPermissionGate } from '@/lib/permission/client-permission-gate';

interface PermissionGroup {
  group: string;
  permissions: { key: string; label: string }[];
}

function groupPermissions(perms: string[]): PermissionGroup[] {
  const map = new Map<string, { key: string; label: string }[]>();
  for (const p of perms) {
    const [, module = 'misc', action = ''] = p.split('.');
    const list = map.get(module) ?? [];
    list.push({ key: p, label: action.replace(/_/g, ' ') });
    map.set(module, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, permissions]) => ({ group, permissions }));
}

export default function RolesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api<Role[]>('/api/admin/rbac/roles'),
  });

  const { data: allPermissions, isLoading: permsLoading } = useQuery({
    queryKey: ['admin-rbac-permissions'],
    queryFn: () => api<string[]>('/api/admin/rbac/permissions'),
  });

  const grouped = useMemo(() => groupPermissions(allPermissions ?? []), [allPermissions]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-roles'] });

  return (
    <AdminShell title='Roles & Permissions' requirePermissions={['admin.rbac.view']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-emerald-500/10 via-transparent to-indigo-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <ShieldCheck className='h-3 w-3 text-emerald-500' />
                RBAC
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Roles &amp; Permissions</h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Group permissions into roles, then assign roles to admins.
              </p>
            </div>
            <ClientPermissionGate permissions={['admin.rbac.manage']}>
              <Button onClick={() => setCreateOpen(true)} className='gap-2'>
                <Plus className='h-4 w-4' />
                New role
              </Button>
            </ClientPermissionGate>
          </div>
        </div>

        {rolesLoading || permsLoading ? (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-64 w-full rounded-xl' />
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {(roles ?? []).map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                groups={grouped}
                onEdit={() => setEditing(role)}
                onDelete={() => setDeleteTarget(role)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} groups={grouped} onCreated={refresh} />

      <EditRoleDialog
        key={editing?.id ?? 'none'}
        role={editing}
        groups={grouped}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />

      <DeleteRoleDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={refresh} />
    </AdminShell>
  );
}

function RoleCard({
  role,
  groups,
  onEdit,
  onDelete,
}: {
  role: Role;
  groups: PermissionGroup[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const total = groups.reduce((s, g) => s + g.permissions.length, 0);
  return (
    <Card className='relative overflow-hidden'>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <span className='truncate'>{role.name}</span>
              {role.is_system_role && (
                <Badge variant='secondary' className='gap-1'>
                  <Lock className='h-3 w-3' />
                  system
                </Badge>
              )}
            </CardTitle>
            <CardDescription className='mt-1'>{role.description || 'No description'}</CardDescription>
          </div>
          <ClientPermissionGate permissions={['admin.rbac.manage']}>
            <div className='flex shrink-0 gap-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={onEdit}
                disabled={role.is_system_role}
                className='gap-1.5'
                title={role.is_system_role ? 'System roles cannot be edited' : 'Edit role'}
              >
                <Edit className='h-3.5 w-3.5' />
                Edit
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={onDelete}
                disabled={role.is_system_role}
                className='text-destructive hover:bg-destructive/10'
                title={role.is_system_role ? 'System roles cannot be deleted' : 'Delete role'}
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </div>
          </ClientPermissionGate>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className='pt-4'>
        <div className='mb-3 flex items-center justify-between text-xs'>
          <span className='text-muted-foreground tracking-wide uppercase'>Permissions</span>
          <span className='font-medium tabular-nums'>
            {role.permissions.length} <span className='text-muted-foreground'>/ {total}</span>
          </span>
        </div>
        <div className='flex flex-wrap gap-1.5'>
          {role.permissions.length === 0 && (
            <span className='text-muted-foreground text-xs italic'>No permissions assigned</span>
          )}
          {role.permissions.slice(0, 12).map((p) => (
            <Badge key={p} variant='outline' className='font-mono text-[10px]'>
              {p.replace('admin.', '')}
            </Badge>
          ))}
          {role.permissions.length > 12 && (
            <Badge variant='secondary' className='text-[10px]'>
              +{role.permissions.length - 12} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionGrid({
  groups,
  selected,
  onToggle,
  disabled,
}: {
  groups: PermissionGroup[];
  selected: Set<string>;
  onToggle: (key: string, on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className='space-y-4'>
      {groups.map((group) => {
        const allOn = group.permissions.every((p) => selected.has(p.key));
        const someOn = group.permissions.some((p) => selected.has(p.key));
        return (
          <div key={group.group} className='bg-muted/30 rounded-lg border p-3'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <KeyRound className='text-muted-foreground h-3.5 w-3.5' />
                <span className='text-sm font-semibold capitalize'>{group.group}</span>
                <Badge variant='secondary' className='text-[10px]'>
                  {group.permissions.filter((p) => selected.has(p.key)).length}/{group.permissions.length}
                </Badge>
              </div>
              <button
                type='button'
                disabled={disabled}
                onClick={() => {
                  const turnOn = !allOn;
                  for (const p of group.permissions) onToggle(p.key, turnOn);
                }}
                className='text-primary text-xs font-medium hover:underline disabled:opacity-50'
              >
                {allOn ? 'Clear all' : someOn ? 'Select all' : 'Select all'}
              </button>
            </div>
            <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
              {group.permissions.map((p) => {
                const on = selected.has(p.key);
                return (
                  <label
                    key={p.key}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                      on
                        ? 'border-primary/40 bg-primary/5'
                        : 'hover:border-border hover:bg-background border-transparent'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input
                      type='checkbox'
                      checked={on}
                      disabled={disabled}
                      onChange={(e) => onToggle(p.key, e.target.checked)}
                      className='sr-only'
                    />
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {on && <Check className='h-3 w-3' />}
                    </div>
                    <span className='truncate font-mono text-xs'>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
  groups,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: PermissionGroup[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: () =>
      api<Role>('/api/admin/rbac/roles', {
        method: 'POST',
        body: { name: name.trim(), description: description.trim(), permissions: [...selected] },
      }),
    onSuccess: () => {
      toast.success(`Role "${name}" created`);
      setName('');
      setDescription('');
      setSelected(new Set());
      onCreated();
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Create failed'),
  });

  const toggle = (key: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-emerald-500' />
            Create role
          </DialogTitle>
          <DialogDescription>Pick a slug name and grant permissions.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='role-name'>Name (slug)</Label>
              <Input
                id='role-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. content_editor'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='role-desc'>Description</Label>
              <Input
                id='role-desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Short summary'
              />
            </div>
          </div>
          <div>
            <Label className='mb-2 block'>Permissions ({selected.size})</Label>
            <PermissionGrid groups={groups} selected={selected} onToggle={toggle} disabled={mutation.isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Create role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleDialog({
  role,
  groups,
  onClose,
  onSaved,
}: {
  role: Role | null;
  groups: PermissionGroup[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));

  const mutation = useMutation({
    mutationFn: () =>
      api<Role>(`/api/admin/rbac/roles/${role!.id}`, {
        method: 'PATCH',
        body: { description, permissions: [...selected] },
      }),
    onSuccess: () => {
      toast.success('Role updated');
      onSaved();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  if (!role) return null;

  const toggle = (key: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <Dialog open={!!role} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Edit className='h-5 w-5 text-emerald-500' />
            Edit role: <span className='font-mono'>{role.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='edit-desc'>Description</Label>
            <Textarea id='edit-desc' value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label className='mb-2 block'>Permissions ({selected.size})</Label>
            <PermissionGrid groups={groups} selected={selected} onToggle={toggle} disabled={mutation.isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: Role | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/rbac/roles/${target!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`Role "${target?.name}" deleted`);
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
            Delete role
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{target.name}</strong>? Cannot be undone.
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
