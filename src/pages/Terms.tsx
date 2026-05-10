import PublicLayout from "@/components/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
    { title: "Acceptance of terms", text: "By accessing ServiceScout, you agree to use the platform in line with these terms and all applicable local laws." },
    { title: "Bookings and payments", text: "Customers agree to provide accurate booking details and payment information. We may process payments through third-party providers such as PayWay." },
    { title: "Provider responsibilities", text: "Providers must deliver services safely, professionally, and in accordance with the service description they publish." },
    { title: "Cancellations and disputes", text: "Cancellations, refunds, and disputes may be handled according to the platform policy, service status, and applicable law." },
    { title: "Acceptable use", text: "You may not misuse the service, attempt unauthorized access, or engage in fraud, harassment, or unlawful activity." },
    { title: "Liability", text: "ServiceScout acts as a marketplace and is not responsible for damages caused by third-party providers beyond what is required by law." },
];

export default function Terms() {
    return (
        <PublicLayout>
            <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-cyan-50/60">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)]" />
                <div className="container relative py-20 lg:py-24 max-w-4xl">
                    <Badge className="rounded-full px-4 py-1.5 mb-5">Terms & conditions</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">The rules that keep the marketplace fair, safe, and predictable.</h1>
                    <p className="mt-5 text-lg text-muted-foreground max-w-3xl">These terms are written to be easy to read. They summarize the main rules for customers, providers, and platform use. If needed, we can add jurisdiction-specific legal text later.</p>
                </div>
            </section>

            <section className="container py-16 max-w-4xl">
                <div className="grid gap-4 md:grid-cols-2">
                    {sections.map((section) => (
                        <Card key={section.title} className="p-6 shadow-card border-slate-200">
                            <h2 className="text-xl font-semibold">{section.title}</h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.text}</p>
                        </Card>
                    ))}
                </div>

                <Separator className="my-10" />

                <Card className="p-6 md:p-8 shadow-elevated border-slate-200 bg-slate-900 text-white">
                    <h2 className="text-2xl font-semibold">Questions about these terms?</h2>
                    <p className="mt-3 text-white/70 max-w-2xl">If you need to review the terms in detail or discuss a service issue, contact support through the platform and we will help you resolve it.</p>
                </Card>
            </section>
        </PublicLayout>
    );
}