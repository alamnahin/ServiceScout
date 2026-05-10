import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminDisputes() {
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase
      .from("disputes")
      .select("*, bookings(total_amount, services(title), providers(business_name))")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function resolve(id: string, status: "resolved" | "refunded") {
    const { error } = await supabase.from("disputes").update({
      status, resolution_note: notes[id] || `Marked ${status}`,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dispute updated");
    load();
  }

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Disputes</h1>
      <div className="grid gap-4">
        {items.length === 0 && <Card className="p-10 text-center text-muted-foreground">No disputes yet</Card>}
        {items.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex justify-between mb-2">
              <div>
                <div className="font-semibold">{d.bookings?.services?.title}</div>
                <div className="text-sm text-muted-foreground">Provider: {d.bookings?.providers?.business_name} · ${Number(d.bookings?.total_amount ?? 0).toFixed(2)}</div>
              </div>
              <Badge variant={d.status === "open" ? "secondary" : "default"}>{d.status}</Badge>
            </div>
            <p className="text-sm mb-3"><span className="font-medium">Reason:</span> {d.reason}</p>
            {d.resolution_note && <p className="text-sm text-muted-foreground mb-3">Resolution: {d.resolution_note}</p>}
            {d.status === "open" && (
              <div className="space-y-2">
                <Textarea placeholder="Resolution note…" value={notes[d.id] || ""} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolve(d.id, "resolved")}>Resolve in provider's favor</Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "refunded")}>Refund customer</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
