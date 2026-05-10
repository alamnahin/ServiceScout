import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PaymentForm from "@/components/PaymentForm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clock, ShieldCheck, ArrowLeft, CheckCircle2, CreditCard, Star, Award, Zap, Heart, TrendingUp } from "lucide-react";
import type { PayWayResponse } from "@/lib/payway";

type BookingStep = "details" | "payment" | "confirmed";

const PRESET_DURATIONS = [30, 60, 90, 120, 180, 240];

export default function ServiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [service, setService] = useState<any>(null);
    const [commission, setCommission] = useState(10);
    const [paymentMode, setPaymentMode] = useState<"sale" | "pre_auth">("sale");
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<BookingStep>("details");
    const [lastPayment, setLastPayment] = useState<PayWayResponse | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);

    const [scheduledAt, setScheduledAt] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");
    const [notes, setNotes] = useState("");

    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [customDuration, setCustomDuration] = useState("");
    const [useCustomDuration, setUseCustomDuration] = useState(false);

    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [seoScore, setSeoScore] = useState({ length: 0, hasKeywords: false });

    const checkSEO = (text: string, serviceTitle?: string) => {
        const keywords = [serviceTitle?.toLowerCase(), "professional", "service", "booking", "cleaning", "maintenance", "repair", "installation"];
        const hasKeywords = keywords.some((kw) => kw && text.toLowerCase().includes(kw));
        setSeoScore({ length: text.length, hasKeywords });
    };

    useEffect(() => {
        if (!id) return;
        Promise.all([
            supabase.from("services").select("*, service_categories(name, slug)").eq("id", id).maybeSingle(),
            supabase.from("platform_settings").select("commission_rate, payment_mode").eq("id", 1).maybeSingle(),
        ]).then(([{ data: s }, { data: ps }]) => {
            setService(s);
            if (s?.duration_minutes) setDurationMinutes(s.duration_minutes);
            if (ps) {
                setCommission(Number(ps.commission_rate));
                setPaymentMode(ps.payment_mode === "pre_auth" ? "pre_auth" : "sale");
            }
            setLoading(false);
        });
    }, [id]);

    useEffect(() => {
        if (!id) return;
        supabase
            .from("bookings")
            .select("reviews(rating, comment, created_at, reviewer_id, provider_id), providers(business_name)")
            .eq("service_id", id)
            .eq("status", "completed")
            .then(({ data }) => {
                if (!data) return;
                const allReviews: any[] = [];
                for (const booking of data) {
                    if (booking.reviews && Array.isArray(booking.reviews)) {
                        for (const review of booking.reviews) {
                            allReviews.push({ ...review, provider_name: booking.providers?.business_name });
                        }
                    }
                }
                setReviews(allReviews);
                if (allReviews.length > 0) {
                    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
                    setAvgRating(+avg.toFixed(1));
                }
            });
    }, [id]);

    function handleDurationPreset(mins: number) {
        setUseCustomDuration(false);
        setCustomDuration("");
        setDurationMinutes(mins);
    }

    function handleCustomDuration(value: string) {
        setCustomDuration(value);
        setUseCustomDuration(true);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
            setDurationMinutes(Math.round(parsed * 60));
        }
    }

    function calcTotal() {
        if (!service) return 0;
        const hourlyRate = Number(service.price);
        return +(hourlyRate * (durationMinutes / 60)).toFixed(2);
    }

    async function handleDetailsSubmit(e: FormEvent) {
        e.preventDefault();
        if (!user) { navigate("/auth"); return; }
        if (!scheduledAt) { toast.error("Pick a date & time"); return; }
        if (durationMinutes < 15) { toast.error("Minimum duration is 15 minutes"); return; }
        if (notes.length > 0 && notes.length < 20) {
            toast.error("Please provide a more detailed description (min 20 characters).");
            return;
        }

        const total = calcTotal();
        const commissionAmt = +((total * commission) / 100).toFixed(2);
        const earning = +(total - commissionAmt).toFixed(2);

        // Create the booking first so we have a real ID for the payment
        const { data, error } = await supabase.from("bookings").insert({
            customer_id: user.id,
            provider_id: null,
            service_id: service.id,
            scheduled_at: new Date(scheduledAt).toISOString(),
            service_address: address,
            service_city: city,
            service_zip: zip,
            notes,
            total_amount: total,
            commission_amount: commissionAmt,
            provider_earning: earning,
            status: "pending",
            payment_status: "unpaid",
            booking_duration_minutes: durationMinutes,
        }).select().single();

        if (error) { toast.error(error.message); return; }

        setBookingId(data.id);
        setStep("payment");
    }

    async function handlePaymentSuccess(response: PayWayResponse) {
        if (!bookingId) return;

        if (!response?.transaction?.transactionId) {
            toast.error("Payment processed but receipt data is missing. Please contact support.");
            return;
        }

        const txn = response.transaction;

        // Update the existing booking with payment details
        const { error } = await supabase.from("bookings").update({
            payment_status: "escrow",
            payway_transaction_id: txn.transactionId,
            payway_receipt_number: txn.receiptNumber,
            payway_response_code: txn.responseCode,
        }).eq("id", bookingId);

        if (error) { toast.error(error.message); return; }

        await supabase.from("payment_transactions").insert({
            booking_id: bookingId,
            payway_transaction_id: txn.transactionId,
            transaction_type: paymentMode === "sale" ? "purchase" : "authorise",
            amount: calcTotal(),
            status: "success",
            response_code: txn.responseCode,
            response_message: txn.responseMessage,
        });

        setLastPayment(response);
        setStep("confirmed");
        toast.success("Payment successful! Your booking is confirmed.");
    }

    if (loading) return <PublicLayout><div className="container py-20 text-center">Loading…</div></PublicLayout>;
    if (!service) return <PublicLayout><div className="container py-20 text-center">Service not found</div></PublicLayout>;

    const total = calcTotal();
    const hourlyRate = Number(service.price);

    if (step === "confirmed" && lastPayment && bookingId) {
        const txn = lastPayment.transaction;
        return (
            <PublicLayout>
                <div className="container py-10 max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex h-16 w-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-emerald-700">Booking Confirmed!</h1>
                        <p className="text-muted-foreground mt-2">Your service has been booked and payment processed successfully.</p>
                    </div>

                    <Card className="p-6 mb-6">
                        <h2 className="font-semibold text-lg mb-4">Service Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{service.title}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date & Time</span><span className="font-medium">{new Date(scheduledAt).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{durationMinutes} min</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">${hourlyRate.toFixed(2)}/hr</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{address}, {city} {zip}</span></div>
                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-medium text-amber-600">Will be assigned by admin</span></div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 mb-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#003B5C]" /> Payment Receipt</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-lg">${total.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono text-sm">{txn.transactionId}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Receipt</span><span className="font-mono text-sm">{txn.receiptNumber}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Response</span><span>{txn.responseMessage}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="default" className="bg-emerald-600">{paymentMode === "sale" ? "Paid" : "Authorised"}</Badge></div>
                        </div>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate("/services")}>Book another service</Button>
                        <Button className="flex-1" onClick={() => navigate("/dashboard")}>View my bookings</Button>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (step === "payment") {
        return (
            <PublicLayout>
                <div className="container py-10 max-w-lg mx-auto">
                    <button onClick={() => setStep("details")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="h-4 w-4" /> Back to details
                    </button>
                    <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>
                    <p className="text-muted-foreground mb-6">{service.title} — {durationMinutes} min at ${hourlyRate.toFixed(2)}/hr = <strong>${total.toFixed(2)}</strong></p>
                    <PaymentForm
                        amount={total}
                        bookingId={bookingId ?? ""}
                        paymentMode={paymentMode}
                        onSuccess={handlePaymentSuccess}
                        onError={(msg) => toast.error(msg)}
                    />
                </div>
            </PublicLayout>
        );
    }

    const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((review) => review.rating === stars).length;
        return { stars, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
    });

    return (
        <PublicLayout>
            <div className="container py-10 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden shadow-lg">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="aspect-video bg-gradient-soft flex items-center justify-center relative group">
                            {service.image_url ? (
                                <>
                                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                                </>
                            ) : (
                                <span className="text-6xl">🛠️</span>
                            )}
                            {avgRating !== null && avgRating >= 4.5 && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.3 }} className="absolute top-4 right-4 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-current" /> Highly rated
                                </motion.div>
                            )}
                        </motion.div>

                        <div className="p-6">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                {service.service_categories && <Badge variant="secondary" className="mb-2">{service.service_categories.name}</Badge>}
                                <h1 className="text-3xl md:text-4xl font-bold">{service.title}</h1>
                            </motion.div>

                            <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Suggested {service.duration_minutes} min</span>
                                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Secure payment via Westpac PayWay</span>
                            </div>

                            {avgRating !== null && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mt-4 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-amber-900">{avgRating}</span>
                                    <span className="text-sm text-amber-700">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                                </motion.div>
                            )}

                            {service.description && (
                                <div className="mt-5 prose prose-slate max-w-none">
                                    <MarkdownRenderer content={service.description} />
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 border-amber-100 bg-amber-50/70">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-amber-600" /> Why choose this service</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { icon: ShieldCheck, label: "Money-back guarantee", desc: "If expectations aren't met" },
                                { icon: Clock, label: "Fast response", desc: "We match providers quickly" },
                                { icon: TrendingUp, label: "Popular choice", desc: `${reviews.length}+ reviews on this service` },
                                { icon: Award, label: "Verified professionals", desc: "Identity and quality checks" },
                            ].map(({ icon: Icon, label, desc }, index) => (
                                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="flex items-start gap-3 rounded-xl bg-white/80 border border-amber-100 p-4 shadow-sm">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{label}</div>
                                        <div className="text-sm text-muted-foreground">{desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {reviews.length > 0 && (
                        <Card className="p-6">
                            <div className="mb-6">
                                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Client Reviews</h2>
                                <div className="space-y-2">
                                    {ratingBreakdown.map(({ stars, count, pct }) => (
                                        <div key={stars} className="flex items-center gap-3">
                                            <div className="flex items-center gap-0.5 w-16">
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <Star key={n} className={`h-3 w-3 ${n <= stars ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                                                ))}
                                            </div>
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-amber-400" />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="border-b last:border-0 pb-4 last:pb-0 hover:bg-muted/30 p-3 rounded-lg transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {review.provider_name?.charAt(0) || "P"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((n) => (
                                                                <Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                                                            ))}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">Verified</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{review.provider_name || "Service Provider"}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {review.comment && <p className="text-sm text-foreground mt-2 pl-14">{review.comment}</p>}
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card className="p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-blue-600" /> What's included</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                "Professional assessment",
                                "Transparent pricing upfront",
                                "Quality guarantee",
                                "Receipt & documentation",
                                "Follow-up support",
                                "Flexible rescheduling",
                            ].map((item, index) => (
                                <motion.div key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-2 rounded-lg border p-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="font-semibold text-lg mb-4">Frequently asked questions</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {[
                                { q: "How quickly will a provider be assigned?", a: "Typically within 24 hours. We carefully match your needs with qualified professionals in your area." },
                                { q: "Can I reschedule my booking?", a: "Yes, you can reschedule up to 48 hours before your appointment with no penalty." },
                                { q: "What if I'm not satisfied?", a: "We offer a satisfaction guarantee and will work with you to make it right." },
                                { q: "Is my payment secure?", a: "Yes, payments are handled through PayWay with encrypted card processing and secure backend handling." },
                            ].map((faq, index) => (
                                <AccordionItem key={index} value={`faq-${index}`}>
                                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>

                    <Card className="p-6">
                        <h2 className="font-semibold text-lg mb-4">How it works</h2>
                        <div className="space-y-3">
                            {[
                                { n: "1", t: "Book & pay securely", d: "Your payment is calculated by hourly rate × duration. Funds are held securely." },
                                { n: "2", t: "We assign a provider", d: "Our admin team assigns a qualified professional based on your service needs." },
                                { n: "3", t: "Service completed", d: "Confirm completion and rate your experience to help other clients." },
                            ].map(({ n, t, d }, index) => (
                                <motion.div key={n} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">{n}</div>
                                    <div>
                                        <div className="font-medium">{t}</div>
                                        <div className="text-sm text-muted-foreground">{d}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-20 shadow-lg border-slate-200">
                        <div className="text-2xl font-bold text-primary">${hourlyRate.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/hr</span></div>
                        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure payment via Westpac PayWay</p>

                        <div className="mb-4">
                            <Label className="mb-2 block">Duration & pricing</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {PRESET_DURATIONS.map((mins) => {
                                    const hours = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
                                    const cost = +(hourlyRate * (mins / 60)).toFixed(2);
                                    const isActive = !useCustomDuration && durationMinutes === mins;
                                    return (
                                        <motion.button
                                            key={mins}
                                            type="button"
                                            onClick={() => handleDurationPreset(mins)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${isActive ? "bg-primary text-primary-foreground border-primary shadow-md" : "hover:border-primary/50 hover:bg-muted/50"}`}
                                        >
                                            {hours}
                                            <span className="block text-xs opacity-70 font-semibold">${cost}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    min="0.25"
                                    step="0.25"
                                    placeholder="Custom hours"
                                    value={customDuration}
                                    onChange={(e) => handleCustomDuration(e.target.value)}
                                    onFocus={() => {
                                        if (customDuration) setUseCustomDuration(true);
                                    }}
                                    className="text-sm"
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">hrs</span>
                            </div>
                        </div>

                        <motion.div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 mb-4 border border-primary/20" layout>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hourly rate</span>
                                    <span className="font-medium">${hourlyRate.toFixed(2)}/hr</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <motion.span key={durationMinutes} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="font-medium">{durationMinutes} min ({(durationMinutes / 60).toFixed(2)}h)</motion.span>
                                </div>
                            </div>
                            <div className="border-t border-primary/20 pt-3 mt-3 flex justify-between items-center">
                                <span className="font-semibold">Total cost</span>
                                <motion.span key={total} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold text-primary">${total.toFixed(2)}</motion.span>
                            </div>
                        </motion.div>

                        <form onSubmit={handleDetailsSubmit} className="space-y-3">
                            <div>
                                <Label>Date & time</Label>
                                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required min={new Date().toISOString().slice(0, 16)} />
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                                <div><Label>Zip</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} required /></div>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <Label>Description / Notes for Provider</Label>
                                    <span
                                        className={`text-xs font-medium ${seoScore.length === 0
                                            ? "text-muted-foreground"
                                            : seoScore.length < 20
                                                ? "text-red-500"
                                                : seoScore.length <= 160
                                                    ? "text-emerald-600"
                                                    : "text-amber-500"
                                            }`}
                                    >
                                        {seoScore.length} / 160 characters
                                    </span>
                                </div>

                                <Textarea
                                    value={notes}
                                    onChange={(e) => {
                                        setNotes(e.target.value);
                                        checkSEO(e.target.value, service?.title);
                                    }}
                                    placeholder="Describe your needs. Include details like room types, specific stains, access instructions, or preferred techniques for better results."
                                    rows={4}
                                    className={seoScore.length > 20 && seoScore.hasKeywords ? "border-emerald-500 focus-visible:ring-emerald-500" : ""}
                                />

                                {seoScore.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Description Quality:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className={`text-[10px] ${seoScore.length >= 20 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "opacity-50"}`}>
                                                {seoScore.length >= 20 ? "✓" : "○"} Min 20 characters
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] ${seoScore.hasKeywords ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "opacity-50"}`}>
                                                {seoScore.hasKeywords ? "✓" : "○"} Includes keywords
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] ${seoScore.length > 50 ? "bg-blue-50 text-blue-700 border-blue-200" : "opacity-50"}`}>
                                                {seoScore.length > 50 ? "✓" : "○"} Detailed (50+ chars)
                                            </Badge>
                                        </div>
                                        {seoScore.length < 20 && (
                                            <p className="text-[11px] text-amber-600 font-medium">💡 Tip: Add more details about your specific needs for better provider matching.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button type="submit" className="w-full" size="lg" disabled={!user}>
                                    {user ? `Continue to payment — $${total.toFixed(2)}` : "Sign in to book"}
                                </Button>
                            </motion.div>
                        </form>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}