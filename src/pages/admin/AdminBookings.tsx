import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, UserPlus, CreditCard, DollarSign, Star, Award } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  accepted: "default",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
};

const PAYMENT_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  unpaid: "destructive",
  escrow: "secondary",
  released: "default",
  refunded: "destructive",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundBooking, setRefundBooking] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  // Payment mode
  const [paymentMode, setPaymentMode] = useState<"sale" | "pre_auth">("sale");
  const [loadingSettings, setLoadingSettings] = useState(true);

  async function loadBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("*, services(title, price), providers(business_name), profiles:customer_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    setBookings(data ?? []);
    setLoading(false);
  }

  async function loadProviders() {
    const { data } = await supabase.from("providers").select("id, business_name, status, rating, total_jobs, user_id").eq("status", "approved").order("business_name");
    setProviders(data ?? []);
  }

  async function loadSettings() {
    const { data } = await supabase.from("platform_settings").select("payment_mode").eq("id", 1).maybeSingle();
    if (data) setPaymentMode(data.payment_mode === "pre_auth" ? "pre_auth" : "sale");
    setLoadingSettings(false);
  }

  useEffect(() => { loadBookings(); loadProviders(); loadSettings(); }, []);

  async function assignProvider() {
    if (!assignBooking || !selectedProvider) { toast.error("Select a provider"); return; }
    setAssigning(true);
    const { error } = await supabase
      .from("bookings")
      .update({ provider_id: selectedProvider, status: "accepted" })
      .eq("id", assignBooking.id);
    setAssigning(false);
    if (error) return toast.error(error.message);

    // Notify provider
    const provider = providers.find((p) => p.id === selectedProvider);
    await supabase.from("notifications").insert({
      user_id: provider?.user_id ?? "",
      title: "New booking assigned",
      message: `You've been assigned to: ${assignBooking.services?.title}`,
      link: "/provider/bookings",
    });

    toast.success("Provider assigned successfully");
    setAssignDialogOpen(false);
    setSelectedProvider("");
    loadBookings();
  }

  async function paywayCapture(
    bookingId: string,
    originalTransactionId: string,
    amount: number
  ) {
    const { data, error } = await supabase.functions.invoke(
      "process-payment",
      {
        body: {
          action: "capture",
          bookingId,
          originalTransactionId,
          amount,
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async function paywayRefund(
    bookingId: string,
    originalTransactionId: string,
    amount: number
  ) {
    const { data, error } = await supabase.functions.invoke(
      "process-payment",
      {
        body: {
          action: "refund",
          bookingId,
          originalTransactionId,
          amount,
        },
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async function capturePayment(booking: any) {
    const result = await paywayCapture(booking.id, booking.payway_transaction_id, Number(booking.total_amount));
    if (result.success) {
      // Edge function already logs to payment_transactions — no DB update needed.
      // Capture just collects pre-authed funds; booking stays in its current status.
      // Customer confirmation will later set payment_status: "released" and credit wallet.
      toast.success("Payment captured successfully");
      loadBookings();
    } else {
      toast.error(result.transaction.responseMessage);
    }
  }

  async function processRefund() {
    if (!refundBooking) return;
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setRefunding(true);

    try {
      const result = await paywayRefund(refundBooking.id, refundBooking.payway_transaction_id, amount);

      if (result.success) {
        // Edge function already logs to payment_transactions — just update booking status here.
        await supabase.from("bookings").update({ status: "cancelled", payment_status: "refunded" }).eq("id", refundBooking.id);
        toast.success(`Refund of $${amount.toFixed(2)} processed`);
        setRefundDialogOpen(false);
        setRefundAmount("");
        setRefundReason("");
        loadBookings();
      } else {
        toast.error(result.transaction.responseMessage);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Refund failed");
    } finally {
      setRefunding(false);
    }
  }

  async function updatePaymentMode(mode: "sale" | "pre_auth") {
    setPaymentMode(mode);
    const { error } = await supabase.from("platform_settings").update({ payment_mode: mode }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success(`Payment mode set to ${mode === "sale" ? "Sale (immediate capture)" : "Pre-authorise + Capture"}`);
  }

  const filtered = bookings.filter((b) => {
    const matchSearch = !searchTerm || b.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || b.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.providers?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Bookings & Payments</h1>

      {/* Payment mode toggle */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold">Payment Mode</div>
              <div className="text-sm text-muted-foreground">
                {paymentMode === "sale" ? "Funds captured immediately on booking" : "Funds authorised at booking, captured after service"}
              </div>
            </div>
          </div>
          {loadingSettings ? null : (
            <div className="flex gap-2">
              <Button variant={paymentMode === "sale" ? "default" : "outline"} size="sm" onClick={() => updatePaymentMode("sale")}>Sale</Button>
              <Button variant={paymentMode === "pre_auth" ? "default" : "outline"} size="sm" onClick={() => updatePaymentMode("pre_auth")}>Pre-auth</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bookings…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings found</TableCell></TableRow>
              ) : filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{b.services?.title}</TableCell>
                  <TableCell>{b.profiles?.full_name}</TableCell>
                  <TableCell>{b.providers?.business_name || <span className="text-amber-600 text-xs">Unassigned</span>}</TableCell>
                  <TableCell><DollarSign className="h-3 w-3 inline mr-1 text-muted-foreground" />{Number(b.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={PAYMENT_COLORS[b.payment_status] ?? "secondary"} className="text-xs">{b.payment_status}</Badge></TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[b.status] ?? "secondary"} className="text-xs">{b.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="space-x-1">
                    {!b.provider_id && b.status === "pending" && (
                      <Button size="sm" variant="default" onClick={() => { setAssignBooking(b); setAssignDialogOpen(true); }}>
                        <UserPlus className="h-3 w-3 mr-1" /> Assign
                      </Button>
                    )}
                    {(b.status === "in_progress" || (b.status === "completed" && b.payment_status === "escrow")) && paymentMode === "pre_auth" && b.payment_status === "escrow" && (
                      <Button size="sm" onClick={() => capturePayment(b)}>
                        <DollarSign className="h-3 w-3 mr-1" /> Capture
                      </Button>
                    )}
                    {(b.payment_status === "escrow" || b.payment_status === "released") && (
                      <Button size="sm" variant="outline" onClick={() => { setRefundBooking(b); setRefundDialogOpen(true); }}>
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Provider</DialogTitle>
            <DialogDescription>Assign a provider for {assignBooking?.services?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Available Providers</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.business_name}</span>
                        {p.rating != null && p.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {Number(p.rating).toFixed(1)}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">({p.total_jobs ?? 0} jobs)</span>
                        {p.rating != null && p.rating >= 4.5 && (
                          <Badge variant="default" className="bg-emerald-600 text-xs h-5 px-1.5">
                            <Award className="h-3 w-3 mr-0.5" />Top
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={assignProvider} disabled={assigning || !selectedProvider}>
              {assigning ? "Assigning…" : "Assign Provider"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Refund for {refundBooking?.services?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount</Label>
              <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder={refundBooking?.total_amount?.toString()} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Refund reason…" />
            </div>
            <Button className="w-full" onClick={processRefund} disabled={refunding}>
              {refunding ? "Processing…" : "Process Refund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
