import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";

export default function ProviderServices() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [myServiceIds, setMyServiceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    const { data: p } = await supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle();
    if (!p) { setLoading(false); return; }
    setProvider(p);

    const [{ data: services }, { data: links }] = await Promise.all([
      supabase.from("services").select("*, service_categories(name)").eq("is_active", true).order("title"),
      supabase.from("provider_services").select("service_id").eq("provider_id", p.id),
    ]);

    setAllServices(services ?? []);
    setMyServiceIds(new Set((links ?? []).map((l: any) => l.service_id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function save() {
    if (!provider) return;
    setSaving(true);

    // Delete existing links
    await supabase.from("provider_services").delete().eq("provider_id", provider.id);

    // Insert new links
    const inserts = Array.from(myServiceIds).map((serviceId) => ({
      provider_id: provider.id,
      service_id: serviceId,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("provider_services").insert(inserts);
      if (error) { setSaving(false); return toast.error(error.message); }
    }

    toast.success("Services updated");
    setSaving(false);
  }

  function toggleService(serviceId: string) {
    const next = new Set(myServiceIds);
    if (next.has(serviceId)) next.delete(serviceId); else next.add(serviceId);
    setMyServiceIds(next);
  }

  if (!provider) {
    return (
      <DashboardLayout role="provider">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No provider profile yet</h2>
          <p className="text-muted-foreground mb-4">Create your provider profile to get started.</p>
        </Card>
      </DashboardLayout>
    );
  }

  // Group services by category
  const grouped: Record<string, any[]> = {};
  allServices.forEach((s) => {
    const cat = s.service_categories?.name ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  return (
    <DashboardLayout role="provider">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services I Offer</h1>
          <p className="text-muted-foreground">Select which platform services you can fulfill</p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Check className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save selections"}
        </Button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, services]) => (
            <Card key={cat} className="p-5">
              <h3 className="font-semibold text-lg mb-3">{cat}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      myServiceIds.has(s.id) ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => toggleService(s.id)}
                  >
                    <Checkbox checked={myServiceIds.has(s.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.title}</div>
                      <div className="text-xs text-muted-foreground">${Number(s.price).toFixed(2)} · {s.duration_minutes}min</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">{myServiceIds.size} of {allServices.length} services selected</p>
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <Plus className="h-4 w-4 mr-1" /> Save selections
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
