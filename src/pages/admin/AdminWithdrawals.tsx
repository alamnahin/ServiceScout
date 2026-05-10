import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CreditCard, ArrowUpRight, DollarSign } from "lucide-react";

export default function AdminWithdrawals() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*, providers(business_name, wallet_balance, user_id)")
      .order("created_at", { ascending: false });
    setReqs(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function process(r: any, status: "approved" | "rejected") {
    if (status === "approved") {
      // Try RPC first (requires the approve_withdrawal_request migration to be pushed)
      const { error: rpcError } = await (supabase as any).rpc("approve_withdrawal_request", { p_request_id: r.id });
      if (!rpcError) {
        toast.success("Withdrawal approved and provider balance updated");
        load();
        return;
      }
      // Fallback: do it client-side if RPC doesn't exist yet
      const amount = Number(r.amount);
      const balance = Number(r.providers?.wallet_balance ?? 0);
      if (balance < amount) return toast.error("Insufficient wallet balance");

      await supabase.from("withdrawal_requests").update({ status: "approved", processed_at: new Date().toISOString() }).eq("id", r.id);
      await supabase.from("providers").update({ wallet_balance: balance - amount }).eq("id", r.provider_id);
      await supabase.from("wallet_transactions").insert({
        provider_id: r.provider_id,
        booking_id: null,
        type: "withdrawal",
        amount,
        balance_after: balance - amount,
        description: "Withdrawal approved by admin",
      });
      toast.success("Withdrawal approved and provider balance updated");
      load();
      return;
    }

    // For non-approvals (reject), just update the request status
    const { error } = await supabase.from("withdrawal_requests").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Withdrawal ${status}`);
    load();
  }

  const totalPending = reqs.filter((r) => r.status === "pending").reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Withdrawals</h1>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Pending payouts</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">${totalPending.toFixed(2)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total withdrawals</div>
          <div className="text-2xl font-bold mt-1">{reqs.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{reqs.filter((r) => r.status === "approved").length}</div>
        </Card>
      </div>

      <Card className="p-5">
        {loading ? <p className="text-muted-foreground">Loading…</p> : reqs.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No withdrawal requests yet.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Provider</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {reqs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{r.providers?.business_name}</TableCell>
                  <TableCell className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" />{Number(r.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{r.method || "bank"}</TableCell>
                  <TableCell><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="space-x-2">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => process(r, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => process(r, "rejected")}>Reject</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
}
