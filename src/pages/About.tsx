import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";

const values = [
    { icon: ShieldCheck, title: "Trust first", text: "Every interaction is designed around verified providers, secure payments, and clear marketplace standards." },
    { icon: Sparkles, title: "Delightful UX", text: "We keep booking, managing, and paying for services simple so customers can move fast with confidence." },
    { icon: Users, title: "Community powered", text: "ServiceScout grows when skilled local professionals and customers win together." },
    { icon: Wallet, title: "Fair earnings", text: "Providers keep control of their work, payout visibility, and service growth path." },
];

export default function About() {
    return (
        <PublicLayout>
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-sky-50" />
                <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
                <div className="container relative py-20 lg:py-24">
                    <div className="max-w-3xl">
                        <Badge className="mb-5 rounded-full px-4 py-1.5">About ServiceScout</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">A marketplace built to make finding trusted help feel effortless.</h1>
                        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">We connect customers with vetted service professionals across home care, maintenance, wellness, tutoring, and more, while keeping booking and payment flows easy to understand.</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild className="rounded-full">
                                <Link to="/services">Browse services <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-full">
                                <Link to="/become-provider">Become a provider</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { value: "10K+", label: "Customers served" },
                            { value: "1.2K+", label: "Verified providers" },
                            { value: "98%", label: "Satisfaction rate" },
                            { value: "50+", label: "Cities covered" },
                        ].map((item) => (
                            <Card key={item.label} className="p-5 shadow-card border-slate-200 bg-white/90 backdrop-blur">
                                <div className="text-3xl font-bold text-cyan-700">{item.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container py-16">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {values.map(({ icon: Icon, title, text }) => (
                        <Card key={title} className="p-6 shadow-card border-slate-200">
                            <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4"><Icon className="h-6 w-6" /></div>
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="container pb-20">
                <Card className="p-8 md:p-10 shadow-elevated border-slate-200 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20" />
                    <div className="relative grid gap-6 md:grid-cols-[1.3fr_0.7fr] items-center">
                        <div>
                            <p className="text-cyan-200 text-sm uppercase tracking-[0.2em]">Our mission</p>
                            <h2 className="mt-3 text-3xl font-bold">Make reliable services feel as simple to book as a ride or delivery.</h2>
                            <p className="mt-4 text-white/70 max-w-2xl">We focus on trust, transparency, and quality so customers can book with confidence and providers can grow sustainable businesses.</p>
                        </div>
                        <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur">
                            <div className="text-sm text-white/60">Need help now?</div>
                            <div className="mt-2 text-2xl font-semibold">Start with the services marketplace.</div>
                            <Button asChild className="mt-5 rounded-full bg-white text-slate-900 hover:bg-slate-100">
                                <Link to="/services">Explore services</Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>
        </PublicLayout>
    );
}