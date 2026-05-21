'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/features/admin/services/api';
import type { Ad, AdSlide, AdKind, AdMediaType } from '@/features/admin/types';
import { fmtDate } from '@/features/admin/utils/format';
import { toast } from 'sonner';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Save,
  Image as ImageIcon,
  Video,
  GalleryHorizontal,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { ClientPermissionGate } from '@/lib/permission/client-permission-gate';

export default function AdsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);

  const { data: ads, isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => api<Ad[]>('/api/admin/ads'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-ads'] });

  const summary = useMemo(() => {
    const rows = ads ?? [];
    return {
      total: rows.length,
      active: rows.filter((a) => a.is_active).length,
      single: rows.filter((a) => a.kind === 'single').length,
      carousel: rows.filter((a) => a.kind === 'carousel').length,
    };
  }, [ads]);

  return (
    <AdminShell title='Ads' requirePermissions={['admin.ad.view_list']}>
      <div className='flex flex-col gap-6'>
        <div className='relative overflow-hidden rounded-2xl border bg-linear-to-br from-purple-500/10 via-transparent to-pink-500/5 p-6 sm:p-8'>
          <div className='pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl' />
          <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <Badge variant='secondary' className='mb-3 gap-1.5'>
                <Megaphone className='h-3 w-3 text-purple-500' />
                Ads
              </Badge>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>Advertising</h1>
              <p className='text-muted-foreground mt-1 text-sm'>
                Single image/video ads and image carousels. Toggle active flag to control visibility.
              </p>
            </div>
            <ClientPermissionGate permissions={['admin.ad.create']}>
              <Button onClick={() => setCreateOpen(true)} className='gap-2'>
                <Plus className='h-4 w-4' />
                New ad
              </Button>
            </ClientPermissionGate>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <MiniStat
            label='Total'
            value={summary.total}
            icon={Megaphone}
            color='text-purple-500'
            ring='ring-purple-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Active'
            value={summary.active}
            icon={Eye}
            color='text-emerald-500'
            ring='ring-emerald-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Single'
            value={summary.single}
            icon={ImageIcon}
            color='text-blue-500'
            ring='ring-blue-500/20'
            loading={isLoading}
          />
          <MiniStat
            label='Carousel'
            value={summary.carousel}
            icon={GalleryHorizontal}
            color='text-pink-500'
            ring='ring-pink-500/20'
            loading={isLoading}
          />
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-56 w-full rounded-xl' />
            ))}
          </div>
        ) : (ads?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <div className='bg-muted rounded-full p-4'>
                <Megaphone className='text-muted-foreground h-8 w-8' />
              </div>
              <div className='text-muted-foreground text-sm'>No ads yet.</div>
              <Button onClick={() => setCreateOpen(true)} size='sm' className='gap-2'>
                <Plus className='h-4 w-4' />
                Create your first ad
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {(ads ?? []).map((ad) => (
              <AdCard key={ad.id} ad={ad} onEdit={() => setEditing(ad)} onDelete={() => setDeleteTarget(ad)} />
            ))}
          </div>
        )}
      </div>

      <CreateAdDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
      <EditAdDialog
        key={editing?.id ?? 'none'}
        ad={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
      <DeleteAdDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={refresh} />
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

function AdPreview({ ad }: { ad: Ad }) {
  if (ad.kind === 'single') {
    if (ad.media_type === 'video') {
      return (
        <video src={ad.media_url ?? undefined} controls className='h-full w-full rounded-lg bg-black object-contain' />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ad.media_url ?? ''} alt={ad.title} className='h-full w-full rounded-lg object-contain' />
    );
  }
  const first = ad.slides[0];
  return (
    <div className='bg-muted relative h-full w-full overflow-hidden rounded-lg'>
      {first ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={first.url} alt={first.caption ?? ad.title} className='h-full w-full object-contain' />
      ) : (
        <div className='flex h-full w-full items-center justify-center'>
          <GalleryHorizontal className='text-muted-foreground h-8 w-8' />
        </div>
      )}
      <Badge className='absolute top-2 right-2 gap-1 bg-black/60 text-white'>
        <GalleryHorizontal className='h-3 w-3' />
        {ad.slides.length}
      </Badge>
    </div>
  );
}

function AdCard({ ad, onEdit, onDelete }: { ad: Ad; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className='overflow-hidden'>
      <div className='bg-muted/40 aspect-video w-full p-2'>
        <AdPreview ad={ad} />
      </div>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <span className='truncate'>{ad.title}</span>
              {ad.is_active ? (
                <Badge className='gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'>
                  <Eye className='h-3 w-3' />
                  Live
                </Badge>
              ) : (
                <Badge variant='secondary' className='gap-1'>
                  <EyeOff className='h-3 w-3' />
                  Hidden
                </Badge>
              )}
            </CardTitle>
            <CardDescription className='mt-1 flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='gap-1 text-[10px]'>
                {ad.kind === 'single' ? (
                  <>
                    {ad.media_type === 'video' ? <Video className='h-3 w-3' /> : <ImageIcon className='h-3 w-3' />}
                    {ad.media_type}
                  </>
                ) : (
                  <>
                    <GalleryHorizontal className='h-3 w-3' />
                    {ad.slides.length} slides
                  </>
                )}
              </Badge>
              <span className='inline-flex items-center gap-1 text-xs'>
                <ArrowUpDown className='h-3 w-3' />
                <span className='tabular-nums'>{ad.display_order}</span>
              </span>
            </CardDescription>
          </div>
          <ClientPermissionGate permissions={['admin.ad.edit', 'admin.ad.delete']}>
            <div className='flex shrink-0 gap-1'>
              <ClientPermissionGate permissions={['admin.ad.edit']}>
                <Button variant='outline' size='sm' onClick={onEdit} className='gap-1.5'>
                  <Edit className='h-3.5 w-3.5' />
                  Edit
                </Button>
              </ClientPermissionGate>
              <ClientPermissionGate permissions={['admin.ad.delete']}>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={onDelete}
                  className='text-destructive hover:bg-destructive/10'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </ClientPermissionGate>
            </div>
          </ClientPermissionGate>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className='space-y-1.5 pt-4 text-xs'>
        {ad.caption && <p className='text-muted-foreground'>{ad.caption}</p>}
        {ad.click_url && (
          <a
            href={ad.click_url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary inline-flex items-center gap-1 hover:underline'
          >
            <ExternalLink className='h-3 w-3' />
            <span className='truncate'>{ad.click_url}</span>
          </a>
        )}
        <p className='text-muted-foreground/70 text-[10px]'>Updated {fmtDate(ad.updated_at)}</p>
      </CardContent>
    </Card>
  );
}

// ── Create dialog ──────────────────────────────────────────
type SingleFields = {
  mediaType: AdMediaType;
  mediaUrl: string;
};

type CarouselFields = {
  slides: AdSlide[];
};

function CreateAdDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<AdKind>('single');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [single, setSingle] = useState<SingleFields>({ mediaType: 'image', mediaUrl: '' });
  const [carousel, setCarousel] = useState<CarouselFields>({ slides: [{ url: '', caption: '', clickUrl: '' }] });

  function reset() {
    setKind('single');
    setTitle('');
    setCaption('');
    setClickUrl('');
    setDisplayOrder('0');
    setIsActive(true);
    setSingle({ mediaType: 'image', mediaUrl: '' });
    setCarousel({ slides: [{ url: '', caption: '', clickUrl: '' }] });
  }

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        title: title.trim(),
        caption: caption.trim() || undefined,
        clickUrl: clickUrl.trim() || undefined,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };
      const body =
        kind === 'single'
          ? { ...base, kind: 'single', mediaType: single.mediaType, mediaUrl: single.mediaUrl.trim() }
          : {
              ...base,
              kind: 'carousel',
              slides: carousel.slides
                .filter((s) => s.url.trim())
                .map((s) => ({
                  url: s.url.trim(),
                  caption: s.caption?.trim() || undefined,
                  clickUrl: s.clickUrl?.trim() || undefined,
                })),
            };
      return api<Ad>('/api/admin/ads', { method: 'POST', body });
    },
    onSuccess: () => {
      toast.success('Ad created');
      reset();
      onCreated();
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Create failed'),
  });

  const canSubmit =
    title.trim().length > 0 &&
    (kind === 'single' ? single.mediaUrl.trim().length > 0 : carousel.slides.some((s) => s.url.trim().length > 0)) &&
    !mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-purple-500' />
            New ad
          </DialogTitle>
          <DialogDescription>Single image/video or image carousel.</DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(v) => setKind(v as AdKind)} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='single' className='gap-2'>
              <ImageIcon className='h-3.5 w-3.5' />
              Single image/video
            </TabsTrigger>
            <TabsTrigger value='carousel' className='gap-2'>
              <GalleryHorizontal className='h-3.5 w-3.5' />
              Carousel
            </TabsTrigger>
          </TabsList>

          <div className='mt-4 space-y-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='ad-title'>Title</Label>
                <Input
                  id='ad-title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Internal name'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ad-order'>Display order</Label>
                <Input
                  id='ad-order'
                  type='number'
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ad-caption'>Caption (optional)</Label>
              <Input
                id='ad-caption'
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder='Short tagline'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ad-click'>Click-through URL (optional)</Label>
              <Input
                id='ad-click'
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder='https://...'
              />
            </div>

            <TabsContent value='single' className='m-0 space-y-3 pt-2'>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]'>
                <div className='space-y-2'>
                  <Label htmlFor='ad-mediatype'>Media type</Label>
                  <Select
                    value={single.mediaType}
                    onValueChange={(v) => setSingle((s) => ({ ...s, mediaType: v as AdMediaType }))}
                  >
                    <SelectTrigger id='ad-mediatype' className='w-full'>
                      <SelectValue placeholder='Select'>
                        {(v) => (
                          <span className='flex items-center gap-2'>
                            {v === 'video' ? <Video className='h-3.5 w-3.5' /> : <ImageIcon className='h-3.5 w-3.5' />}
                            {v}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='image'>image</SelectItem>
                      <SelectItem value='video'>video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='ad-mediaurl'>Media URL</Label>
                  <Input
                    id='ad-mediaurl'
                    value={single.mediaUrl}
                    onChange={(e) => setSingle((s) => ({ ...s, mediaUrl: e.target.value }))}
                    placeholder='https://cdn.../file.jpg or .mp4'
                  />
                </div>
              </div>
              {single.mediaUrl && (
                <div className='bg-muted/40 rounded-lg border p-3'>
                  <div className='text-muted-foreground mb-2 text-[10px] tracking-wide uppercase'>Preview</div>
                  {single.mediaType === 'video' ? (
                    <video src={single.mediaUrl} controls className='max-h-60 w-full rounded bg-black object-contain' />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={single.mediaUrl} alt='preview' className='max-h-60 w-full rounded object-contain' />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value='carousel' className='m-0 space-y-3 pt-2'>
              <SlideEditor slides={carousel.slides} onChange={(slides) => setCarousel({ slides })} />
            </TabsContent>

            <div className='bg-muted/40 flex items-center justify-between rounded-lg border p-3'>
              <div>
                <Label htmlFor='ad-active' className='text-sm font-medium'>
                  Active
                </Label>
                <p className='text-muted-foreground text-xs'>Hidden ads are not returned to public clients.</p>
              </div>
              <input
                id='ad-active'
                type='checkbox'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='h-4 w-4 cursor-pointer'
              />
            </div>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Create ad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ────────────────────────────────────────────
function EditAdDialog({ ad, onClose, onSaved }: { ad: Ad | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(ad?.title ?? '');
  const [caption, setCaption] = useState(ad?.caption ?? '');
  const [clickUrl, setClickUrl] = useState(ad?.click_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(ad?.display_order ?? 0));
  const [isActive, setIsActive] = useState(ad?.is_active ?? true);
  const [mediaType, setMediaType] = useState<AdMediaType>(ad?.media_type ?? 'image');
  const [mediaUrl, setMediaUrl] = useState(ad?.media_url ?? '');
  const [slides, setSlides] = useState<AdSlide[]>(ad?.slides ?? []);

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        title,
        caption,
        clickUrl,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };
      if (ad!.kind === 'single') {
        body.mediaType = mediaType;
        body.mediaUrl = mediaUrl;
      } else {
        body.slides = slides
          .filter((s) => s.url.trim())
          .map((s) => ({
            url: s.url.trim(),
            caption: s.caption?.trim() || undefined,
            clickUrl: s.clickUrl?.trim() || undefined,
          }));
      }
      return api<Ad>(`/api/admin/ads/${ad!.id}`, { method: 'PATCH', body });
    },
    onSuccess: () => {
      toast.success('Ad updated');
      onSaved();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  });

  if (!ad) return null;

  return (
    <Dialog open={!!ad} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Edit className='h-5 w-5 text-purple-500' />
            Edit ad
            <Badge variant='outline' className='ml-1 gap-1 text-[10px]'>
              {ad.kind === 'single' ? (
                <>
                  {mediaType === 'video' ? <Video className='h-3 w-3' /> : <ImageIcon className='h-3 w-3' />}
                  single
                </>
              ) : (
                <>
                  <GalleryHorizontal className='h-3 w-3' />
                  carousel
                </>
              )}
            </Badge>
          </DialogTitle>
          <DialogDescription>{ad.title}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 pt-2'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='edit-title'>Title</Label>
              <Input id='edit-title' value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-order'>Display order</Label>
              <Input
                id='edit-order'
                type='number'
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-caption'>Caption</Label>
            <Input id='edit-caption' value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-click'>Click-through URL</Label>
            <Input id='edit-click' value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} />
          </div>

          {ad.kind === 'single' ? (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]'>
              <div className='space-y-2'>
                <Label>Media type</Label>
                <Select value={mediaType} onValueChange={(v) => setMediaType(v as AdMediaType)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue>
                      {(v) => (
                        <span className='flex items-center gap-2'>
                          {v === 'video' ? <Video className='h-3.5 w-3.5' /> : <ImageIcon className='h-3.5 w-3.5' />}
                          {v}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='image'>image</SelectItem>
                    <SelectItem value='video'>video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-mediaurl'>Media URL</Label>
                <Input id='edit-mediaurl' value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
              </div>
            </div>
          ) : (
            <SlideEditor slides={slides} onChange={setSlides} />
          )}

          <div className='bg-muted/40 flex items-center justify-between rounded-lg border p-3'>
            <div>
              <Label htmlFor='edit-active' className='text-sm font-medium'>
                Active
              </Label>
              <p className='text-muted-foreground text-xs'>Hidden ads are not returned to public clients.</p>
            </div>
            <input
              id='edit-active'
              type='checkbox'
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className='h-4 w-4 cursor-pointer'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className='gap-2'>
            {mutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Slide editor ───────────────────────────────────────────
function SlideEditor({ slides, onChange }: { slides: AdSlide[]; onChange: (s: AdSlide[]) => void }) {
  const setSlide = (idx: number, patch: Partial<AdSlide>) => {
    onChange(slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const addSlide = () => onChange([...slides, { url: '', caption: '', clickUrl: '' }]);
  const removeSlide = (idx: number) => onChange(slides.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...slides];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label>Slides ({slides.length})</Label>
        <Button type='button' size='sm' variant='outline' onClick={addSlide} className='gap-1.5'>
          <Plus className='h-3.5 w-3.5' />
          Add slide
        </Button>
      </div>
      {slides.length === 0 && (
        <p className='text-muted-foreground text-xs'>No slides yet. Click &quot;Add slide&quot; to start.</p>
      )}
      {slides.map((slide, idx) => (
        <div key={idx} className='bg-muted/30 space-y-2 rounded-lg border p-3'>
          <div className='flex items-center justify-between'>
            <Badge variant='secondary' className='font-mono text-[10px]'>
              #{idx + 1}
            </Badge>
            <div className='flex gap-1'>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className='h-7 w-7'
              >
                ↑
              </Button>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={() => move(idx, 1)}
                disabled={idx === slides.length - 1}
                className='h-7 w-7'
              >
                ↓
              </Button>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={() => removeSlide(idx)}
                className='text-destructive h-7 w-7'
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
          <div className='space-y-2'>
            <Input
              placeholder='Image URL (https://...)'
              value={slide.url}
              onChange={(e) => setSlide(idx, { url: e.target.value })}
            />
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <Input
                placeholder='Caption (optional)'
                value={slide.caption ?? ''}
                onChange={(e) => setSlide(idx, { caption: e.target.value })}
              />
              <Input
                placeholder='Click URL (optional)'
                value={slide.clickUrl ?? ''}
                onChange={(e) => setSlide(idx, { clickUrl: e.target.value })}
              />
            </div>
            {slide.url && (
              <div className='bg-background overflow-hidden rounded border'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.url} alt='preview' className='max-h-32 w-full object-contain' />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Delete dialog ──────────────────────────────────────────
function DeleteAdDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: Ad | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/ads/${target!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`Ad "${target?.title}" deleted`);
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
            Delete ad
          </DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{target.title}</strong>?
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
