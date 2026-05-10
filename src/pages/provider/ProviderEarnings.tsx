import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function ProviderEarnings() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");

  async function load() {
    if (!user) return;
    const { data: p } = await supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle();
    setProvider(p);
    if (!p) return;
    const [{ data: t }, { data: w }] = await Promise.all([
      supabase.from("wallet_transactions").select("*").eq("provider_id", p.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawal_requests").select("*").eq("provider_id", p.id).order("created_at", { ascending: false }),
    ]);
    setTxns(t ?? []); setWithdrawals(w ?? []);
  }

  useEffect(() => { load(); }, [user]);

  async function requestPayout() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > Number(provider.wallet_balance)) return toast.error("Amount exceeds wallet balance");
    const { error } = await supabase.from("withdrawal_requests").insert({
      provider_id: provider.id, amount: amt, account_details: details, method: "bank",
    });
    if (error) return toast.error(error.message);
    toast.success("Payout requested");
    setOpen(false); setAmount(""); setDetails("");
    load();
  }

  return (
    <DashboardLayout role="provider">
      <h1 className="text-3xl font-bold mb-6">Earnings</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><div className="text-sm text-muted-foreground">Wallet balance</div><div className="text-3xl font-bold mt-1 text-primary">${Number(provider?.wallet_balance ?? 0).toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Total jobs</div><div className="text-3xl font-bold mt-1">{provider?.total_jobs ?? 0}</div></Card>
        <Card className="p-5 flex items-center justify-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Request payout</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Request a payout</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Amount ($)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div><Label>Bank account / details</Label><Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Account info" /></div>
                <Button onClick={requestPayout} className="w-full">Submit request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-3">Withdrawal history</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {withdrawals.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No withdrawals yet</TableCell></TableRow> :
              withdrawals.map((w) => <TableRow key={w.id}>
                <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                <TableCell>${Number(w.amount).toFixed(2)}</TableCell>
                <TableCell><Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}>{w.status}</Badge></TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Transactions</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
          <TableBody>
            {txns.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No transactions yet</TableCell></TableRow> :
              txns.map((t) => <TableRow key={t.id}>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                <TableCell className={t.type === "credit" ? "text-emerald-600 font-medium" : ""}>{t.type === "credit" ? "+" : "-"}${Number(t.amount).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.description}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}
