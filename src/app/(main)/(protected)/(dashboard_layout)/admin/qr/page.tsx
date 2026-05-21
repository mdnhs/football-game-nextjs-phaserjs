'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Copy, QrCode as QrIcon, Scan, CheckCircle2, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { api, apiBase } from '@/features/admin/services/api';
import type { Paginated, QrCode } from '@/features/admin/types';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useQuery } from '@tanstack/react-query';

export default function QrPage() {
  const [page] = useState(1);
  const limit = 50;
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<QrCode | null>(null);
  const [form, setForm] = useState({ label: '', targetPath: '/', ref: '' });

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ['admin-qr-codes', page, limit],
    queryFn: () => api<Paginated<QrCode>>(`/api/admin/qr-codes?page=${page}&limit=${limit}`),
  });

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Load failed');
    }
  }, [error]);

  async function createQr() {
    if (!form.label.trim()) {
      toast.error('Label required');
      return;
    }
    try {
      const created = await api<QrCode>('/api/admin/qr-codes', {
        method: 'POST',
        body: {
          label: form.label.trim(),
          targetPath: form.targetPath || '/',
          ...(form.ref.trim() ? { ref: form.ref.trim() } : {}),
        },
      });
      toast.success(`QR ${created.ref} created`);
      setForm({ label: '', targetPath: '/', ref: '' });
      setCreateOpen(false);
      setPreview(created);
      setPreviewOpen(true);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function toggleActive(q: QrCode) {
    setBusy(q.id);
    try {
      const action = q.is_active ? 'deactivate' : 'activate';
      await api(`/api/admin/qr-codes/${q.id}/${action}`, { method: 'PATCH' });
      toast.success(`QR ${action}d`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  function scanUrl(ref: string): string {
    return `${apiBase}/qr/${ref}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied'),
      () => toast.error('Copy failed'),
    );
  }

  function downloadQr(q: QrCode) {
    const canvas = document.getElementById(`qr-preview-canvas`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${q.ref}.png`;
    a.click();
  }

  const columns = createColumns(setPreview, setPreviewOpen, toggleActive, busy);

  const summary = useMemo(() => {
    const rows = data?.data ?? [];
    const totalScans = rows.reduce((s, q) => s + (q.scan_count ?? 0), 0);
    const active = rows.filter((q) => q.is_active).length;
    return { totalScans, active, total: data?.total ?? rows.length };
  }, [data]);

  return (
    <AdminShell title='QR Codes' requirePermissions={['admin.qr.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-[#00e676]/10 via-transparent to-purple-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#00e676]/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <QrIcon className='h-3 w-3 text-[#00e676]' />
                Campaigns
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>QR Code Campaigns</h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Generate trackable QR entry points for offline-to-online activations.
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className='gap-2 bg-[#00e676] font-semibold text-[#000814] shadow-[0_8px_24px_-8px_rgba(0,230,118,0.6)] hover:bg-[#00ff7f]'
            >
              <Plus className='h-4 w-4' />
              New QR Code
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <MiniStat
            label='Total QR Codes'
            value={summary.total}
            icon={QrIcon}
            color='text-[#00e676]'
            ring='ring-[#00e676]/20'
            loading={isLoading}
          />
          <MiniStat
            label='Active'
            value={summary.active}
            icon={CheckCircle2}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Total Scans'
            value={summary.totalScans}
            icon={Scan}
            color='text-purple-500'
            ring='ring-purple-500/20'
            loading={isLoading}
          />
        </div>

        <Card className='overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-muted/30 border-b px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary ring-primary/20 rounded-full p-2 ring-1'>
                <QrIcon className='h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>Campaign Entry Points</CardTitle>
                <CardDescription>Manage QR codes, track scans, drill into analytics.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            {isLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (data?.data?.length ?? 0) === 0 ? (
              <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
                <div className='bg-muted rounded-full p-4'>
                  <QrIcon className='text-muted-foreground h-8 w-8' />
                </div>
                <div className='text-muted-foreground text-sm'>No QR codes yet. Create one to get started.</div>
                <Button onClick={() => setCreateOpen(true)} size='sm' className='mt-2 gap-2'>
                  <Plus className='h-4 w-4' />
                  New QR Code
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data?.data ?? []}
                searchKey='label'
                searchPlaceholder='Find by label...'
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <div className='bg-primary/10 text-primary rounded-lg p-1.5'>
                <Plus className='h-4 w-4' />
              </div>
              Create new QR entry
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='label'>Campaign Label</Label>
              <Input
                id='label'
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder='e.g. Dhaka Mall Stall A'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='targetPath'>Target path</Label>
              <Input
                id='targetPath'
                value={form.targetPath}
                onChange={(e) => setForm({ ...form, targetPath: e.target.value })}
                placeholder='/'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ref'>Custom reference (optional)</Label>
              <Input
                id='ref'
                value={form.ref}
                onChange={(e) => setForm({ ...form, ref: e.target.value })}
                placeholder='Short code for the URL'
              />
            </div>
          </div>
          <DialogFooter className='sm:justify-end'>
            <Button variant='ghost' onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createQr}>Generate QR Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <QrIcon className='h-5 w-5 text-[#00e676]' />
              {preview?.label}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className='space-y-5 pt-2'>
              <div className='relative flex justify-center overflow-hidden rounded-xl border bg-linear-to-br from-white to-zinc-100 p-6 shadow-inner'>
                <QRCodeCanvas id='qr-preview-canvas' value={scanUrl(preview.ref)} size={220} level='H' includeMargin />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <PreviewStat label='Scans' value={preview.scan_count} />
                <PreviewStat
                  label='Status'
                  value={preview.is_active ? 'Active' : 'Inactive'}
                  accent={preview.is_active ? 'text-emerald-500' : 'text-muted-foreground'}
                />
              </div>
              <div className='bg-muted/50 space-y-3 rounded-lg border p-4'>
                <Field label='Short Reference' value={preview.ref} onCopy={() => copyToClipboard(preview.ref)} />
                <Field
                  label='Redirect URL'
                  value={scanUrl(preview.ref)}
                  onCopy={() => copyToClipboard(scanUrl(preview.ref))}
                />
              </div>
              <div className='flex gap-3'>
                <Button variant='outline' onClick={() => setPreviewOpen(false)} className='flex-1'>
                  Close
                </Button>
                <Button onClick={() => downloadQr(preview)} className='flex-1 gap-2'>
                  <Download className='h-4 w-4' />
                  Download PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

function PreviewStat({ label, value, accent = '' }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className='bg-muted/40 rounded-lg border p-3'>
      <div className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-[10px] font-black tracking-widest uppercase'>{label}</Label>
      <div className='flex items-center gap-2'>
        <code className='bg-background flex-1 truncate rounded border px-2 py-1.5 font-mono text-xs'>{value}</code>
        <Button variant='ghost' size='icon' onClick={onCopy} className='h-8 w-8'>
          <Copy className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}
