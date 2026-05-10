import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, ArrowUpRight } from "lucide-react";

const TYPE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  purchase: "default",
  authorise: "secondary",
  capture: "default",
  refund: "destructive",
  query: "outline",
};

export default function AdminPayments() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    const { data } = await supabase
      .from("payment_transactions")
      .select("*, bookings(services(title), profiles:customer_id(full_name))")
      .order("created_at", { ascending: false });
    setTransactions(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter((t) => {
    const matchSearch = !searchTerm ||
      t.payway_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bookings?.services?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bookings?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || t.transaction_type === filterType;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = filtered.filter((t) => t.transaction_type === "refund").reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">PayWay Transaction Log</h1>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total processed</div>
          <div className="text-2xl font-bold mt-1">${totalAmount.toFixed(2)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total refunds</div>
          <div className="text-2xl font-bold text-red-600 mt-1">${totalRefunds.toFixed(2)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Net revenue</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">${(totalAmount - totalRefunds).toFixed(2)}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="authorise">Authorise</SelectItem>
            <SelectItem value="capture">Capture</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? <p className="text-muted-foreground p-5">Loading…</p> : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No transactions found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{t.bookings?.services?.title || "—"}</TableCell>
                  <TableCell>{t.bookings?.profiles?.full_name || "—"}</TableCell>
                  <TableCell><Badge variant={TYPE_COLORS[t.transaction_type] ?? "outline"}>{t.transaction_type}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1 font-medium"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" />{Number(t.amount).toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-xs">{t.payway_transaction_id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.response_message}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "success" ? "default" : t.status === "failed" ? "destructive" : "secondary"}>
                      {t.status}
                    </Badge>
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
