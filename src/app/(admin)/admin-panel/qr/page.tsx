"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, BarChart3, Copy } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { api, apiBase } from "@/lib/admin/api";
import type { Paginated, QrCode } from "@/lib/admin/types";
import { fmtDate } from "@/lib/admin/format";
import { toast } from "sonner";

export default function QrPage() {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [data, setData] = useState<Paginated<QrCode> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<QrCode | null>(null);
  const [form, setForm] = useState({ label: "", targetPath: "/", ref: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Paginated<QrCode>>(
        `/api/admin/qr-codes?page=${page}&limit=${limit}`,
      );
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function createQr() {
    if (!form.label.trim()) {
      toast.error("Label required");
      return;
    }
    try {
      const created = await api<QrCode>("/api/admin/qr-codes", {
        method: "POST",
        body: {
          label: form.label.trim(),
          targetPath: form.targetPath || "/",
          ...(form.ref.trim() ? { ref: form.ref.trim() } : {}),
        },
      });
      toast.success(`QR ${created.ref} created`);
      setForm({ label: "", targetPath: "/", ref: "" });
      setCreateOpen(false);
      setPreview(created);
      setPreviewOpen(true);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggleActive(q: QrCode) {
    setBusy(q.id);
    try {
      const action = q.is_active ? "deactivate" : "activate";
      await api(`/api/admin/qr-codes/${q.id}/${action}`, { method: "PATCH" });
      toast.success(`QR ${action}d`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  function scanUrl(ref: string): string {
    return `${apiBase}/qr/${ref}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed"),
    );
  }

  function downloadQr(q: QrCode) {
    const canvas = document.getElementById(
      `qr-preview-canvas`,
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${q.ref}.png`;
    a.click();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <AdminShell title="QR Codes">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New QR
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create QR code</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Mirpur Stall A"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetPath">Target path</Label>
                <Input
                  id="targetPath"
                  value={form.targetPath}
                  onChange={(e) => setForm({ ...form, targetPath: e.target.value })}
                  placeholder="/"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ref">Custom ref (optional)</Label>
                <Input
                  id="ref"
                  value={form.ref}
                  onChange={(e) => setForm({ ...form, ref: e.target.value })}
                  placeholder="auto"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createQr}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.label}</TableCell>
                      <TableCell className="font-mono">{q.ref}</TableCell>
                      <TableCell className="text-right">{q.scan_count}</TableCell>
                      <TableCell>
                        {q.is_active ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(q.created_at)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreview(q);
                            setPreviewOpen(true);
                          }}
                        >
                          QR
                        </Button>
                        <Button
                          render={<Link href={`/admin-panel/qr/${q.id}`} />}
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={q.is_active ? "destructive" : "default"}
                          size="sm"
                          disabled={busy === q.id}
                          onClick={() => toggleActive(q)}
                        >
                          {q.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No QR codes yet. Click &quot;New QR&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data ? `${data.total} total` : ""}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded">
                <QRCodeCanvas
                  id="qr-preview-canvas"
                  value={scanUrl(preview.ref)}
                  size={240}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="space-y-2 text-sm">
                <Field
                  label="Ref"
                  value={preview.ref}
                  onCopy={() => copyToClipboard(preview.ref)}
                />
                <Field
                  label="Scan URL"
                  value={scanUrl(preview.ref)}
                  onCopy={() => copyToClipboard(scanUrl(preview.ref))}
                />
                <Field
                  label="Frontend URL"
                  value={preview.url}
                  onCopy={() => copyToClipboard(preview.url)}
                />
              </div>
              <Button onClick={() => downloadQr(preview)} className="w-full">
                Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{value}</code>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
