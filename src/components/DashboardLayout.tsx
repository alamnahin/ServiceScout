import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, LayoutDashboard, Calendar, Wallet, Settings, ShieldCheck, Users, Tag, Receipt, BarChart3, AlertTriangle, CreditCard, Store, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({ children, role }: { children: React.ReactNode; role: "provider" | "admin" }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  // const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false).then(({ count }) => setUnread(count ?? 0));
  }, [user, pathname]);

  const providerNav = [
    { to: "/provider", icon: LayoutDashboard, label: "Overview" },
    { to: "/provider/services", icon: Briefcase, label: "Services I offer" },
    { to: "/provider/bookings", icon: Calendar, label: "Assigned jobs" },
    { to: "/provider/earnings", icon: Wallet, label: "Earnings" },
  ];

  const adminNav = [
    { to: "/admin", icon: BarChart3, label: "Dashboard" },
    { to: "/admin/providers", icon: Users, label: "Providers" },
    { to: "/admin/bookings", icon: Calendar, label: "Bookings & Payments" },
    { to: "/admin/payments", icon: CreditCard, label: "Transaction Log" },
    { to: "/admin/services", icon: Store, label: "Services" },
    { to: "/admin/categories", icon: Tag, label: "Categories" },
    { to: "/admin/withdrawals", icon: Receipt, label: "Withdrawals" },
    { to: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
    { to: "/admin/reviews", icon: Star, label: "Reviews" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const nav = role === "provider" ? providerNav : adminNav;
  const Icon = role === "provider" ? Briefcase : ShieldCheck;
  const title = role === "provider" ? "Provider Panel" : "Admin Panel";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 p-5 border-b border-slate-700">
          <img src="/logo.png" alt="ServiceScout" className="h-7 w-auto" />
        </Link>
        <div className="px-5 py-3 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" /> {title}
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === n.to ? "bg-cyan-600/20 text-cyan-400 font-semibold" : "hover:bg-slate-800"
            )}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-1">
          {/* {unread > 0 && <div className="px-3 py-2 text-xs text-slate-400">🔔 {unread} new notifications</div>} */}
          <button onClick={signOut} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-800">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b bg-background p-4 flex items-center justify-between">
          <Link to="/" className="font-bold">
            <img src="/logo.png" alt="ServiceScout" className="h-7 w-auto" />
          </Link>
          <Badge>{title}</Badge>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
