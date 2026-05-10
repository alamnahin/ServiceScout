import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Star, MapPin, Calendar, Receipt, Clock } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  accepted: "default",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "Waiting for provider assignment",
  accepted: "Provider accepted your booking",
  in_progress: "Service is in progress",
  completed: "Service completed",
  cancelled: "Booking cancelled",
  disputed: "Dispute opened",
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, services(title, description), providers(business_name, user_id), reviews(*)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function confirmCompletion(b: any) {
    // The DB trigger trg_booking_completion handles:
    // - crediting provider wallet
    // - incrementing total_jobs
    // - setting payment_status to "released"
    // - sending notifications
    // All we need to do is update the status.
    const { error } = await supabase.from("bookings").update({
      status: "completed",
      customer_confirmed: true,
    }).eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Service confirmed! Payment released to provider.");
    load();
  }

  async function openDispute(b: any) {
    const reason = window.prompt("Briefly describe the issue:");
    if (!reason || !user) return;
    const { error } = await supabase.from("disputes").insert({
      booking_id: b.id, raised_by: user.id, reason,
    });
    if (error) return toast.error(error.message);
    await supabase.from("bookings").update({ status: "disputed" }).eq("id", b.id);
    toast.success("Dispute opened. Our team will review it.");
    load();
  }

  async function submitReview() {
    if (!reviewDialog || !user) return;
    if (!reviewDialog.provider_id) return toast.error("No provider assigned to this booking yet.");
    const { error } = await supabase.from("reviews").insert({
      booking_id: reviewDialog.id, reviewer_id: user.id,
      provider_id: reviewDialog.provider_id, rating, comment,
    });
    if (error) return toast.error(error.message);
    const { data: rs } = await supabase.from("reviews").select("rating").eq("provider_id", reviewDialog.provider_id);
    if (rs?.length) {
      const avg = rs.reduce((a, r) => a + r.rating, 0) / rs.length;
      await supabase.from("providers").update({ rating: +avg.toFixed(2) }).eq("id", reviewDialog.provider_id);
    }
    toast.success("Review posted!");
    setReviewDialog(null); setRating(5); setComment("");
    load();
  }

  return (
    <PublicLayout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Button asChild variant="outline"><Link to="/services">Book a new service</Link></Button>
        </div>
        <p className="text-muted-foreground mb-8">Track your service requests and payment status</p>

        {loading ? <p className="text-center py-20 text-muted-foreground">Loading…</p> :
          bookings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg font-semibold mb-2">No bookings yet</p>
              <p className="text-muted-foreground mb-4">Browse services to make your first booking.</p>
              <Button asChild><Link to="/services">Browse services</Link></Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((b) => (
                <Card key={b.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={STATUS_VARIANT[b.status]}>{b.status.replace("_", " ")}</Badge>
                        <Badge variant="outline">{b.payment_status}</Badge>
                        {b.payway_receipt_number && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Receipt className="h-3 w-3" /> {b.payway_receipt_number}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{b.services?.title}</h3>
                      {b.provider_id ? (
                        <p className="text-sm text-muted-foreground">by {b.providers?.business_name}</p>
                      ) : (
                        <p className="text-sm text-amber-600">Waiting for provider assignment</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(b.scheduled_at).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {b.service_address}, {b.service_city}</span>
                        {b.payway_transaction_id && (
                          <span className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" /> Paid via PayWay</span>
                        )}
                      </div>
                      {b.notes && <p className="text-sm text-muted-foreground mt-2 italic">"{b.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${Number(b.total_amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">{STATUS_DESCRIPTIONS[b.status] || ""}</div>
                      <div className="flex flex-col gap-2 mt-3">
                        {b.status === "in_progress" && !b.customer_confirmed && (
                          <>
                            <Button size="sm" onClick={() => confirmCompletion(b)}>Confirm completion</Button>
                            <Button size="sm" variant="outline" onClick={() => openDispute(b)}>Open dispute</Button>
                          </>
                        )}
                        {b.status === "completed" && (!b.reviews || b.reviews.length === 0) && (
                          <Dialog open={reviewDialog?.id === b.id} onOpenChange={(o) => !o && setReviewDialog(null)}>
                            <DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => setReviewDialog(b)}>Leave review</Button></DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Rate {b.providers?.business_name}</DialogTitle></DialogHeader>
                              <div className="flex gap-1 my-3">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button key={n} onClick={() => setRating(n)}>
                                    <Star className={`h-8 w-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                                  </button>
                                ))}
                              </div>
                              <Textarea placeholder="Share your experience…" value={comment} onChange={(e) => setComment(e.target.value)} />
                              <Button onClick={submitReview}>Post review</Button>
                            </DialogContent>
                          </Dialog>
                        )}
                        {b.status === "completed" && b.reviews && b.reviews.length > 0 && (
                          <div className="mt-2 text-sm">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} className={`h-4 w-4 ${n <= b.reviews[0].rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                              ))}
                              <span className="text-muted-foreground ml-1">Your review posted</span>
                            </div>
                            {b.reviews[0].comment && <p className="text-muted-foreground mt-1 italic">"{b.reviews[0].comment}"</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </div>
    </PublicLayout>
  );
}
