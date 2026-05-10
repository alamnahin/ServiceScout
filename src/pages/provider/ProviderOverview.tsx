import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowUpRight, Briefcase, Calendar, CheckCircle2, Star, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

type BookingSnapshot = {
  created_at: string;
  scheduled_at: string;
  provider_earning: number;
  status: string;
  service_address: string | null;
  service_city: string | null;
};

const bookingStatusPalette: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
  disputed: "#dc2626",
};

export default function ProviderOverview() {
  const [provider, setProvider] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, completed: 0, earnings: 0 });
  const [bookings, setBookings] = useState<BookingSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: p } = await supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle();
      setProvider(p);
      if (!p) {
        setLoading(false);
        return;
      }
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      const [{ count: pending }, { count: completed }] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("provider_id", p.id).eq("status", "pending"),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("provider_id", p.id).eq("status", "completed"),
      ]);
      const { data: bookingRows } = await supabase
        .from("bookings")
        .select("created_at, scheduled_at, provider_earning, status, service_address, service_city")
        .eq("provider_id", p.id)
        .order("scheduled_at", { ascending: true });

      setStats({ pending: pending ?? 0, completed: completed ?? 0, earnings: Number(p.wallet_balance ?? 0) });
      setBookings(((bookingRows ?? []) as BookingSnapshot[]).filter((row) => new Date(row.created_at) >= since));
      setLoading(false);
    })();
  }, []);

  const monthWindow = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
      };
    });
  }, []);

  const monthlyTrend = useMemo(() => monthWindow.map(({ key, label }) => {
    const monthRows = bookings.filter((row) => row.created_at.startsWith(key));
    const earnings = monthRows.reduce((sum, row) => sum + Number(row.provider_earning || 0), 0);
    return {
      month: label,
      bookings: monthRows.length,
      earnings,
    };
  }), [bookings, monthWindow]);

  const bookingStatusData = useMemo(() => {
    const order = ["pending", "accepted", "in_progress", "completed", "cancelled", "disputed"];
    return order
      .map((status) => ({
        status,
        label: status.replace(/_/g, " "),
        value: bookings.filter((row) => row.status === status).length,
        fill: bookingStatusPalette[status] ?? "#94a3b8",
      }))
      .filter((entry) => entry.value > 0);
  }, [bookings]);

  const chartConfig = {
    bookings: { label: "Bookings", color: "#14b8a6" },
    earnings: { label: "Earnings", color: "#f59e0b" },
  };

  const statusChartConfig = useMemo(() => bookingStatusData.reduce<Record<string, { label: string; color: string }>>((acc, item) => {
    acc[item.status] = { label: item.label, color: item.fill };
    return acc;
  }, {}), [bookingStatusData]);

  if (!provider) {
    return (
      <DashboardLayout role="provider">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No provider profile yet</h2>
          <p className="text-muted-foreground mb-4">Create your provider profile to start receiving assignments.</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="provider">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{provider.business_name}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <Badge variant={provider.status === "approved" ? "default" : "secondary"} className="rounded-full">{provider.status}</Badge>
              <span className="text-sm text-muted-foreground">Live overview of your booking flow, earnings, and capacity.</span>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/provider/earnings">View earnings</Link>
          </Button>
        </div>
      </div>

      {provider.status !== "approved" && (
        <Card className="p-4 bg-amber-50 border-amber-200 mb-6">
          <p className="text-sm text-amber-800">Your provider account is <b>{provider.status}</b>. You'll receive assignments once approved by an admin.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Calendar} label="Pending" value={stats.pending} helper="Unassigned jobs" />
        <StatCard icon={Briefcase} label="Completed" value={stats.completed} helper="Finished bookings" />
        <StatCard icon={Wallet} label="Wallet" value={`$${stats.earnings.toFixed(2)}`} helper="Current balance" />
        <StatCard icon={Star} label="Rating" value={Number(provider.rating ?? 0).toFixed(1)} helper="Customer average" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr] mb-6">
        <Card className="p-6 shadow-card border-slate-200 overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-sm text-muted-foreground">Performance trend</p>
              <h2 className="text-xl font-semibold">Bookings and earnings by month</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="h-4 w-4 text-emerald-600" /> Rolling six months</div>
          </div>
          <ChartContainer config={chartConfig} className="h-[360px] w-full aspect-auto">
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="providerEarningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="providerBookingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area type="monotone" dataKey="earnings" stroke="#f59e0b" fill="url(#providerEarningsFill)" strokeWidth={2.5} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="bookings" stroke="#14b8a6" fill="url(#providerBookingsFill)" strokeWidth={2.5} activeDot={{ r: 5 }} />
            </AreaChart>
          </ChartContainer>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6 shadow-card border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Job mix</p>
                <h2 className="text-xl font-semibold">Booking statuses</h2>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
            </div>
            <ChartContainer config={statusChartConfig} className="h-[230px] w-full aspect-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={bookingStatusData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} strokeWidth={2}>
                  {bookingStatusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent verticalAlign="bottom" />} />
              </PieChart>
            </ChartContainer>
          </Card>

          <Card className="p-6 shadow-card border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Recent activity</p>
                <h2 className="text-xl font-semibold">Latest jobs</h2>
              </div>
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="space-y-3">
              {bookings.slice(-4).reverse().map((booking) => (
                <div key={`${booking.created_at}-${booking.scheduled_at}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="font-medium text-sm">{booking.service_city || booking.service_address || "Assigned job"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(booking.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">${Number(booking.provider_earning || 0).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{booking.status.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-sm text-muted-foreground py-2">No recent jobs yet.</p>}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, helper }: any) {
  return (
    <Card className="p-5 shadow-card border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{helper}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}
