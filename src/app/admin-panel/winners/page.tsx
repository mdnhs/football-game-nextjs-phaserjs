"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, apiBlob } from "@/lib/admin/api";
import type { DailyWinner } from "@/lib/admin/types";
import { today } from "@/lib/admin/format";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function WinnersPage() {
  const [date, setDate] = useState(today());
  const [winners, setWinners] = useState<DailyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<DailyWinner[]>(`/api/admin/winners?date=${date}`);
      setWinners(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const blob = await apiBlob(`/api/admin/winners/export?date=${date}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `winners-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AdminShell title="Winners">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={downloadCsv} disabled={downloading || !winners.length}>
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Downloading…" : "Export CSV"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Goals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : winners.map((w, i) => (
                    <TableRow key={w.player_id}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell className="font-medium">{w.display_name}</TableCell>
                      <TableCell className="font-mono text-sm">{w.phone}</TableCell>
                      <TableCell className="text-right font-mono">{w.best_score}</TableCell>
                      <TableCell className="text-right font-mono">{w.best_goals}</TableCell>
                    </TableRow>
                  ))}
              {!loading && winners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No winners for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
