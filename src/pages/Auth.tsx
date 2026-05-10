import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRight, BadgeCheck, CalendarDays, ShieldCheck, Sparkles, Star } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().min(2, "Name required").max(100),
});
const signInSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("mode") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState(initial);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ email, password, fullName });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Welcome to ServiceScout.");
    navigate("/");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate("/");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_34%),linear-gradient(180deg,_#f8fbff_0%,_#eef6fb_100%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="ServiceScout" className="h-10 w-auto" />
          </Link>

          <div className="mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Secure, fast account setup
            </div>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900">
              Create your account and start booking trusted help today.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Join a polished service marketplace built for fast booking, verified professionals, and secure PayWay payments.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, title: "Verified providers", text: "Every booking stays protected from start to finish." },
                { icon: CalendarDays, title: "Easy scheduling", text: "Book the time that fits your day in a few clicks." },
                { icon: BadgeCheck, title: "Trusted checkout", text: "Secure payments handled through PayWay." },
                { icon: Star, title: "High quality", text: "Designed to make the booking experience feel premium." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl lg:justify-self-end">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <img src="/logo.png" alt="ServiceScout" className="h-9 w-auto" />
          </Link>

          <Card className="relative overflow-hidden border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" />
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Welcome</div>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Sign in or create your account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use the same polished flow for returning users and new registrations.</p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full mb-6 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-slate-50/80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-slate-50/80" />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-200 hover:from-cyan-700 hover:to-blue-700" disabled={loading}>
                    {loading ? "Signing in…" : <span className="inline-flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12 bg-slate-50/80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-slate-50/80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Password</Label>
                    <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-slate-50/80" />
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-200 hover:from-cyan-700 hover:to-blue-700" disabled={loading}>
                    {loading ? "Creating…" : <span className="inline-flex items-center gap-2">Create account <ArrowRight className="h-4 w-4" /></span>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
