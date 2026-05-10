import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderSchedule() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [schedule, setSchedule] = useState<Record<number, { start_time: string; end_time: string; is_off_day: boolean }>>({});

  async function load() {
    if (!user) return;
    const { data: p } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
    if (!p) return;
    setProvider(p);
    const { data } = await supabase.from("provider_schedules").select("*").eq("provider_id", p.id);
    const map: any = {};
    for (let i = 0; i < 7; i++) {
      const row = data?.find((r) => r.day_of_week === i);
      map[i] = row ? { start_time: row.start_time.slice(0, 5), end_time: row.end_time.slice(0, 5), is_off_day: row.is_off_day }
                   : { start_time: "09:00", end_time: "17:00", is_off_day: i === 0 };
    }
    setSchedule(map);
  }

  useEffect(() => { load(); }, [user]);

  async function save() {
    if (!provider) return;
    const rows = Object.entries(schedule).map(([d, v]) => ({ provider_id: provider.id, day_of_week: Number(d), ...v }));
    const { error } = await supabase.from("provider_schedules").upsert(rows, { onConflict: "provider_id,day_of_week" });
    if (error) return toast.error(error.message);
    toast.success("Schedule saved");
  }

  return (
    <DashboardLayout role="provider">
      <h1 className="text-3xl font-bold mb-6">Weekly schedule</h1>
      <Card className="p-6">
        <div className="space-y-3">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-28 font-medium">{d}</div>
              <Switch checked={!schedule[i]?.is_off_day} onCheckedChange={(c) => setSchedule({ ...schedule, [i]: { ...schedule[i], is_off_day: !c } })} />
              <Input type="time" disabled={schedule[i]?.is_off_day} value={schedule[i]?.start_time ?? "09:00"} onChange={(e) => setSchedule({ ...schedule, [i]: { ...schedule[i], start_time: e.target.value } })} className="w-32" />
              <span>–</span>
              <Input type="time" disabled={schedule[i]?.is_off_day} value={schedule[i]?.end_time ?? "17:00"} onChange={(e) => setSchedule({ ...schedule, [i]: { ...schedule[i], end_time: e.target.value } })} className="w-32" />
              {schedule[i]?.is_off_day && <span className="text-sm text-muted-foreground">Off day</span>}
            </div>
          ))}
        </div>
        <Button onClick={save} className="mt-5">Save schedule</Button>
      </Card>
    </DashboardLayout>
  );
}
