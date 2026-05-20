"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/admin/api";
import type { Paginated, FlaggedScore } from "@/lib/admin/types";
import { fmtDate } from "@/lib/admin/format";
import { toast } from "sonner";

export default function FlaggedScoresPage() {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [data, setData] = useState<Paginated<FlaggedScore> | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FlaggedScore | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Paginated<FlaggedScore>>(
        `/api/admin/scores/flagged?page=${page}&limit=${limit}`,
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

  function openDetails(s: FlaggedScore) {
    setSelected(s);
    setOpen(true);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <AdminShell title="Flagged Scores">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead>Played</TableHead>
                <TableHead className="text-right">Shot log</TableHead>
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
                : data?.data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.players?.display_name ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {s.players?.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{s.total_score}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.goals}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(s.played_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetails(s)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No flagged scores.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data ? `${data.total} flagged` : ""}</span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shot log</DialogTitle>
            <DialogDescription>
              {selected?.players?.display_name} — {fmtDate(selected?.played_at)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Timing</TableHead>
                  <TableHead className="text-right">Power</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.shot_log.map((s) => (
                  <TableRow key={s.shotIndex}>
                    <TableCell>{s.shotIndex + 1}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.result === "goal"
                            ? "default"
                            : s.result === "saved"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {s.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {s.timing.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {s.power.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {s.durationMs}ms
                    </TableCell>
                    <TableCell className="text-right font-mono">{s.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
