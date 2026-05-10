import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [providers, setProviders] = useState<{ id: string; business_name: string }[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0 });

  async function load() {
    setLoading(true);

    const { data: provs } = await supabase.from("providers").select("id, business_name").order("business_name");
    setProviders(provs ?? []);

    const { data } = await supabase
      .from("reviews")
      .select("*, providers(business_name), profiles:reviewer_id(full_name), bookings(services(title))")
      .order("created_at", { ascending: false });

    setReviews(data ?? []);
    if (data?.length) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setStats({ total: data.length, avgRating: +avg.toFixed(1) });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = reviews.filter((r) => {
    const matchProvider = filterProvider === "all" || r.provider_id === filterProvider;
    const matchRating = filterRating === "all" || r.rating === parseInt(filterRating);
    return matchProvider && matchRating;
  });

  // Per-provider stats
  const providerStats = new Map<string, { name: string; count: number; total: number }>();
  for (const r of reviews) {
    const key = r.provider_id;
    const existing = providerStats.get(key) ?? { name: r.providers?.business_name, count: 0, total: 0 };
    existing.count++;
    existing.total += r.rating;
    providerStats.set(key, existing);
  }

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Reviews</h1>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total Reviews</div>
          <div className="text-3xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Average Rating</div>
          <div className="text-3xl font-bold mt-1 flex items-center gap-2">
            {stats.avgRating}
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Providers Rated</div>
          <div className="text-3xl font-bold mt-1">{providerStats.size}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All providers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.business_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All ratings" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} star{n !== 1 ? "s" : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-5">
        {loading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No reviews found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{r.providers?.business_name}</TableCell>
                  <TableCell>{r.profiles?.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.bookings?.services?.title || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                      <span className="ml-1 text-sm font-medium">{r.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{r.comment || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Per-Provider Summary */}
      {providerStats.size > 0 && (
        <Card className="p-5 mt-6">
          <h2 className="font-semibold text-lg mb-4">Provider Rating Summary</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(providerStats.entries()).map(([id, { name, count, total }]) => {
              const avg = +(total / count).toFixed(1);
              return (
                <div key={id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3 w-3 ${n <= Math.round(Number(avg)) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                      <span className="text-sm ml-1">{avg}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">{count} review{count !== 1 ? "s" : ""}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
