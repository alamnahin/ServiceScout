import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AlertTriangle, ArrowUpRight, Briefcase, Calendar, CheckCircle2, Clock3, DollarSign, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

type BookingSnapshot = {
  created_at: string;
  commission_amount: number;
  status: string;
  payment_status: string;
};

type ProviderSnapshot = {
  status: string;
};

const statusPalette: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
  disputed: "#dc2626",
};

const providerStatusPalette: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  suspended: "#ef4444",
  rejected: "#64748b",
};

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0, revenue: 0, pendingBookings: 0, openDisputes: 0 });
  const [bookings, setBookings] = useState<BookingSnapshot[]>([]);
  const [providerRows, setProviderRows] = useState<ProviderSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);

    (async () => {
      const [u, p, b, r, pending, disputes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("providers").select("status"),
        supabase.from("bookings").select("created_at, commission_amount, status, payment_status"),
        supabase.from("bookings").select("commission_amount").eq("payment_status", "released"),
        supabase.from("bookings").select("*", { count: "exact", head: true }).is("provider_id", null),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);

      const revenue = (r.data ?? []).reduce((sum: number, row: any) => sum + Number(row.commission_amount), 0);
      setStats({
        users: u.count ?? 0,
        providers: p.data?.length ?? 0,
        bookings: b.data?.length ?? 0,
        revenue,
        pendingBookings: pending.count ?? 0,
        openDisputes: disputes.count ?? 0,
      });
      setBookings(((b.data ?? []) as BookingSnapshot[]).filter((row) => new Date(row.created_at) >= since));
      setProviderRows((p.data ?? []) as ProviderSnapshot[]);
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

  const bookingTrend = useMemo(() => monthWindow.map(({ key, label }) => {
    const monthRows = bookings.filter((row) => row.created_at.startsWith(key));
    const revenue = monthRows.reduce((sum, row) => sum + Number(row.commission_amount || 0), 0);
    return {
      month: label,
      bookings: monthRows.length,
      revenue,
    };
  }), [bookings, monthWindow]);

  const bookingStatusData = useMemo(() => {
    const order = ["pending", "accepted", "in_progress", "completed", "cancelled", "disputed"];
    return order
      .map((status) => ({
        status,
        label: status.replace(/_/g, " "),
        value: bookings.filter((row) => row.status === status).length,
        fill: statusPalette[status] ?? "#94a3b8",
      }))
      .filter((entry) => entry.value > 0);
  }, [bookings]);

  const providerStatusData = useMemo(() => {
    const order = ["pending", "approved", "suspended", "rejected"];
    return order.map((status) => ({
      status,
      label: status,
      value: providerRows.filter((row) => row.status === status).length,
      fill: providerStatusPalette[status] ?? "#94a3b8",
    }));
  }, [providerRows]);

  const chartConfig = {
    bookings: { label: "Bookings", color: "#14b8a6" },
    revenue: { label: "Revenue", color: "#2563eb" },
  };

  const statusChartConfig = useMemo(() => bookingStatusData.reduce<Record<string, { label: string; color: string }>>((acc, item) => {
    acc[item.status] = { label: item.label, color: item.fill };
    return acc;
  }, {}), [bookingStatusData]);

  const providerChartConfig = useMemo(() => providerStatusData.reduce<Record<string, { label: string; color: string }>>((acc, item) => {
    acc[item.status] = { label: item.label, color: item.fill };
    return acc;
  }, {}), [providerStatusData]);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <Badge variant="secondary" className="rounded-full">Live data</Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl">A live view of marketplace activity, revenue movement, and moderation pressure across the platform.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total users" value={stats.users} color="text-blue-600" helper="Registered profiles" />
        <StatCard icon={Briefcase} label="Providers" value={stats.providers} color="text-purple-600" helper="Active provider accounts" />
        <StatCard icon={Calendar} label="Total bookings" value={stats.bookings} color="text-emerald-600" helper="Marketplace orders" />
        <StatCard icon={DollarSign} label="Platform revenue" value={`$${stats.revenue.toFixed(2)}`} color="text-amber-600" helper="Commission released" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] mb-6">
        <Card className="p-6 shadow-card border-slate-200 overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-sm text-muted-foreground">Bookings + revenue</p>
              <h2 className="text-xl font-semibold">Six month trend</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="h-4 w-4 text-emerald-600" /> Dynamic snapshot</div>
          </div>
          <ChartContainer config={chartConfig} className="h-[360px] w-full aspect-auto">
            <AreaChart data={bookingTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#fillRevenue)" strokeWidth={2.5} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="bookings" stroke="#14b8a6" fill="url(#fillBookings)" strokeWidth={2.5} activeDot={{ r: 5 }} />
            </AreaChart>
          </ChartContainer>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6 shadow-card border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking mix</p>
                <h2 className="text-xl font-semibold">Status breakdown</h2>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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
                <p className="text-sm text-muted-foreground">Provider health</p>
                <h2 className="text-xl font-semibold">Account states</h2>
              </div>
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
            <ChartContainer config={providerChartConfig} className="h-[230px] w-full aspect-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={providerStatusData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} strokeWidth={2}>
                  {providerStatusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent verticalAlign="bottom" />} />
              </PieChart>
            </ChartContainer>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 flex items-center justify-between border-amber-200 bg-amber-50/80">
          <div>
            <div className="text-sm text-amber-700">Pending provider assignments</div>
            <div className="text-2xl font-bold text-amber-900">{loading ? "…" : stats.pendingBookings}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><Calendar className="h-5 w-5" /></div>
        </Card>
        <Card className="p-5 flex items-center justify-between border-red-200 bg-red-50/80">
          <div>
            <div className="text-sm text-red-700">Open disputes</div>
            <div className="text-2xl font-bold text-red-900">{loading ? "…" : stats.openDisputes}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color, helper }: any) {
  return (
    <Card className="p-5 shadow-card border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{helper}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg bg-primary/10 ${color} flex items-center justify-center`}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}
