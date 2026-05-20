"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/admin/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [form, setForm] = useState({
    campaignStart: "",
    campaignEnd: "",
    dailyPlayLimit: "",
    difficultyBase: "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, string | number> = {};
    if (form.campaignStart) payload.campaignStart = form.campaignStart;
    if (form.campaignEnd) payload.campaignEnd = form.campaignEnd;
    if (form.dailyPlayLimit) payload.dailyPlayLimit = Number(form.dailyPlayLimit);
    if (form.difficultyBase) payload.difficultyBase = Number(form.difficultyBase);

    if (!Object.keys(payload).length) {
      toast.error("Nothing to update");
      setSaving(false);
      return;
    }

    try {
      await api("/api/admin/settings", { method: "PATCH", body: payload });
      toast.success("Settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Settings">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Campaign settings</CardTitle>
          <CardDescription>
            Only filled fields are sent. Leave blank to keep current value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignStart">Campaign start</Label>
              <Input
                id="campaignStart"
                type="datetime-local"
                value={form.campaignStart}
                onChange={(e) => setForm({ ...form, campaignStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignEnd">Campaign end</Label>
              <Input
                id="campaignEnd"
                type="datetime-local"
                value={form.campaignEnd}
                onChange={(e) => setForm({ ...form, campaignEnd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyPlayLimit">Daily play limit</Label>
              <Input
                id="dailyPlayLimit"
                type="number"
                min={1}
                max={100}
                value={form.dailyPlayLimit}
                onChange={(e) => setForm({ ...form, dailyPlayLimit: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficultyBase">Difficulty base (0–1)</Label>
              <Input
                id="difficultyBase"
                type="number"
                step="0.001"
                min={0}
                max={1}
                value={form.difficultyBase}
                onChange={(e) => setForm({ ...form, difficultyBase: e.target.value })}
                placeholder="0"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
