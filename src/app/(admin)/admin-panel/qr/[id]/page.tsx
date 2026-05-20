"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";
import { api, apiBase } from "@/lib/admin/api";
import type { QrStats } from "@/lib/admin/types";
import { fmtDate } from "@/lib/admin/format";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function QrStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [stats, setStats] = useState<QrStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<QrStats>(`/api/admin/qr-codes/${id}/stats`);
        setStats(res);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <AdminShell title="QR Stats">
      <div className="mb-4">
        <Button
          render={<Link href="/admin-panel/qr" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stats.label}</span>
                {stats.is_active ? (
                  <Badge variant="secondary">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Ref" value={<code className="font-mono">{stats.ref}</code>} />
              <Row label="Target path" value={stats.target_path} />
              <Row label="Created" value={fmtDate(stats.created_at)} />
              <Row label="Updated" value={fmtDate(stats.updated_at)} />
              <Row label="Scan URL" value={<code className="font-mono text-xs">{`${apiBase}/qr/${stats.ref}`}</code>} />
              <Row label="Frontend URL" value={<code className="font-mono text-xs">{stats.url}</code>} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Scans" value={stats.scan_count} />
                <Stat label="Signups / scores" value={stats.signups} />
              </div>
              <div className="flex justify-center pt-2 bg-white rounded p-3">
                <QRCodeCanvas value={`${apiBase}/qr/${stats.ref}`} size={200} level="H" includeMargin />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">Not found.</p>
      )}
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
