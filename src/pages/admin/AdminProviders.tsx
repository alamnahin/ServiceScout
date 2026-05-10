import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function AdminProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    const { data: provs, error } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }

    const ids = (provs ?? []).map((p) => p.user_id);
    let profileMap: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
    }
    setProviders((provs ?? []).map((p) => ({ ...p, owner_name: profileMap[p.user_id] ?? "—" })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: "approved" | "rejected" | "suspended" | "pending") {
    const { error } = await supabase.from("providers").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  }

  const filtered = providers.filter((p) => {
    const matchSearch = !searchTerm || p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Providers</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search providers…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-5">
        {loading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No providers found.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Business</TableHead><TableHead>Owner</TableHead><TableHead>City</TableHead><TableHead>Rating</TableHead><TableHead>Jobs</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.business_name}</TableCell>
                  <TableCell>{p.owner_name}</TableCell>
                  <TableCell>{p.city || "—"}</TableCell>
                  <TableCell>{Number(p.rating ?? 0).toFixed(1)}</TableCell>
                  <TableCell>{p.total_jobs ?? 0}</TableCell>
                  <TableCell><Badge variant={p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="space-x-2">
                    {p.status === "pending" && <Button size="sm" onClick={() => setStatus(p.id, "approved")}>Approve</Button>}
                    {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}>Reject</Button>}
                    {p.status === "approved" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "suspended")}>Suspend</Button>}
                    {p.status === "suspended" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "pending")}>Reset</Button>}
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
