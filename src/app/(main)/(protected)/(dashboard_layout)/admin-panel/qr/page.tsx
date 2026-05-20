'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Copy, QrCode as QrIcon } from 'lucide-react';
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

  const { data, error, refetch } = useQuery({
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

  return (
    <AdminShell title='QR Codes'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-3xl font-bold tracking-tight'>QR Campaigns</h2>
          <Button onClick={() => setCreateOpen(true)} className='gap-2'>
            <Plus className='h-4 w-4' />
            New QR Code
          </Button>
        </div>

        <Card className='overflow-hidden p-0 shadow-sm'>
          <CardHeader className='bg-muted/30 border-b px-6 py-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 text-primary rounded-full p-2'>
                <QrIcon className='h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-lg'>Campaign Entry Points</CardTitle>
                <CardDescription>Manage QR codes for offline-to-online marketing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              searchKey='label'
              searchPlaceholder='Find by label...'
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Create new QR entry</DialogTitle>
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
              <QrIcon className='h-5 w-5' />
              {preview?.label}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className='space-y-6 pt-4'>
              <div className='flex justify-center overflow-hidden rounded-xl border bg-white p-6 shadow-sm'>
                <QRCodeCanvas id='qr-preview-canvas' value={scanUrl(preview.ref)} size={220} level='H' includeMargin />
              </div>
              <div className='bg-muted/50 space-y-3 rounded-lg p-4'>
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
                <Button onClick={() => downloadQr(preview)} className='flex-1'>
                  <Copy className='mr-2 h-4 w-4' />
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
