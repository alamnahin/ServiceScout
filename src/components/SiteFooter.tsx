import { Link } from "react-router-dom";
import { ShieldCheck, Star, Zap } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-0">
      {/* Top trust bar */}
      <div className="border-b border-slate-800">
        <div className="container py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          {[
            { icon: ShieldCheck, title: "PayWay secured", desc: "Payments via Westpac PayWay" },
            { icon: Star, title: "4.9★ avg rating", desc: "Rated by 10,000+ customers" },
            { icon: Zap, title: "Same-day booking", desc: "Pros available when you need them" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{title}</div>
                <div className="text-slate-500 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img src="/logo.png" alt="ServiceScout" className="h-8 w-auto" />
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">Your on-demand marketplace for trusted, vetted service professionals — cleaning to electrical, beauty to tutoring.</p>
          <div className="mt-5 flex gap-3">
            {["𝕏", "in", "f"].map((s) => (
              <div key={s} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 cursor-pointer transition-colors text-sm font-bold">{s}</div>
            ))}
          </div>
        </div>
        {[
          { heading: "Customers", links: [{ label: "Browse services", to: "/services" }, { label: "My bookings", to: "/dashboard" }, { label: "How it works", to: "/" }] },
          { heading: "Providers", links: [{ label: "Become a provider", to: "/become-provider" }, { label: "Provider dashboard", to: "/provider" }, { label: "Earnings", to: "/provider/earnings" }] },
          { heading: "Company", links: [{ label: "About us", to: "/about" }, { label: "Terms & conditions", to: "/terms" }, { label: "Contact", to: "/" }] },
        ].map(({ heading, links }) => (
          <div key={heading}>
            <h4 className="font-semibold text-white mb-4 text-sm">{heading}</h4>
            <ul className="space-y-3">
              {links.map(({ label, to }) => (
                <li key={label}><Link to={to} className="text-sm hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} ServiceScout. All rights reserved.</span>
          <span>Payments powered by Westpac PayWay</span>
        </div>
      </div>
    </footer>
  );
}
