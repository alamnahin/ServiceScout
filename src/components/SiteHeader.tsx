import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, LayoutDashboard, LogOut, Search, ShieldCheck, User as UserIcon, Menu, X } from "lucide-react";

export default function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = user?.email?.[0]?.toUpperCase() ?? "U";
  const isProvider = roles.includes("provider");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/services", label: "Browse Services", end: false },
    { to: "/about", label: "About us", end: false },
    { to: "/terms", label: "Terms & conditions", end: false },
    { to: "/become-provider", label: "Become a Provider", end: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-slate-100/50"
      style={{
        boxShadow: scrolled ? "0 1px 30px -5px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="ServiceScout" className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 rounded-full" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-full shadow-md shadow-cyan-200 hover:shadow-cyan-300 transition-shadow" asChild>
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent hover:ring-cyan-200 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border border-slate-100 p-1">
                <div className="px-3 py-2 mb-1">
                  <div className="font-semibold text-slate-900 truncate text-sm">{user.email}</div>
                  <div className="text-xs text-slate-500 capitalize mt-0.5">{roles.join(", ")}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer"><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> My Bookings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer"><Link to="/profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
                {isProvider && <DropdownMenuItem asChild className="rounded-xl cursor-pointer"><Link to="/provider"><Briefcase className="mr-2 h-4 w-4" /> Provider Panel</Link></DropdownMenuItem>}
                {isAdmin && <DropdownMenuItem asChild className="rounded-xl cursor-pointer"><Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          {!user && (
            <div className="pt-2 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" asChild onClick={() => setMobileOpen(false)}><Link to="/auth">Sign in</Link></Button>
              <Button className="flex-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white" asChild onClick={() => setMobileOpen(false)}><Link to="/auth?mode=signup">Get started</Link></Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ to, end, children, className, onClick }: { to: string; end?: boolean; children: React.ReactNode; className?: (ctx: { isActive: boolean }) => string; onClick?: () => void }) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
  return <Link to={to} onClick={onClick} className={className?.({ isActive })}>{children}</Link>;
}
