import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, MapPin, Clock, Check, X } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  accepted: "default",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
};

export default function ProviderBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data: provider } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
    if (!provider) { setLoading(false); return; }
    setProviderId(provider.id);

    const { data } = await supabase
      .from("bookings")
      .select("*, services(title, description), profiles:customer_id(full_name)")
      .eq("provider_id", provider.id)
      .order("scheduled_at", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user || !providerId) return;
    const ch = supabase.channel("provider-bookings")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "bookings",
        filter: `provider_id=eq.${providerId}`,
      }, () => load())
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `provider_id=eq.${providerId}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, providerId]);

  async function update(b: any, status: "accepted" | "cancelled" | "completed" | "in_progress") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", b.id);
    if (error) return toast.error(error.message);

    // Notify customer
    await supabase.from("notifications").insert({
      user_id: b.customer_id,
      title: `Booking ${status.replace("_", " ")}`,
      message: `Your booking for ${b.services?.title} is now ${status.replace("_", " ")}`,
      link: "/dashboard",
    });

    toast.success(`Booking ${status.replace("_", " ")}`);
    load();
  }

  return (
    <DashboardLayout role="provider">
      <h1 className="text-3xl font-bold mb-6">My Assigned Jobs</h1>

      {loading ? <p className="text-center py-20 text-muted-foreground">Loading…</p> : bookings.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-semibold mb-2">No assigned jobs yet</p>
          <p>When admin assigns you a booking, it will appear here.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={STATUS_COLORS[b.status]}>{b.status.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{b.services?.title}</h3>
                  <p className="text-sm text-muted-foreground">Customer: {b.profiles?.full_name}</p>
                  <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-4">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(b.scheduled_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {b.service_address}, {b.service_city} {b.service_zip}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {b.booking_duration_minutes ?? b.services?.duration_minutes}min</span>
                  </div>
                  {b.notes && <p className="text-sm mt-2 italic">"{b.notes}"</p>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">${Number(b.provider_earning).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">your earning</div>
                  <div className="flex flex-col gap-2 mt-3">
                    {b.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => update(b, "accepted")}>
                          <Check className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => update(b, "cancelled")}>
                          <X className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    {b.status === "accepted" && (
                      <Button size="sm" onClick={() => update(b, "in_progress")}>Start job</Button>
                    )}
                    {b.status === "in_progress" && (
                      <p className="text-xs text-muted-foreground bg-slate-50 px-3 py-2 rounded-lg">Awaiting customer confirmation</p>
                    )}
                    {b.status === "completed" && (
                      <Badge variant="default" className="bg-emerald-600">Completed</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
