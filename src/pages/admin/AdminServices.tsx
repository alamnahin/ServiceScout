import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Edit3, Search, Plus, Trash2 } from "lucide-react";

type ServiceRow = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    is_active: boolean;
    duration_minutes: number | null;
    image_url: string | null;
    category_id: string | null;
    updated_at: string;
    service_categories: { name: string | null; id: string | null } | null;
};

type Category = { id: string; name: string };

export default function AdminServices() {
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ServiceRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [fTitle, setFTitle] = useState("");
    const [fDesc, setFDesc] = useState("");
    const [fPrice, setFPrice] = useState("0");
    const [fDuration, setFDuration] = useState("60");
    const [fCategory, setFCategory] = useState("");
    const [fImageUrl, setFImageUrl] = useState("");

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function load() {
        setLoading(true);
        const [{ data: sData, error: sErr }, { data: cData }] = await Promise.all([
            supabase.from("services").select("id, title, description, price, is_active, duration_minutes, image_url, category_id, updated_at, service_categories(name, id)").order("title"),
            supabase.from("service_categories").select("id, name").eq("is_active", true).order("name"),
        ]);
        if (sErr) toast.error(sErr.message);
        setServices((sData ?? []) as ServiceRow[]);
        setCategories((cData ?? []) as Category[]);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return services;
        return services.filter((s) =>
            s.title.toLowerCase().includes(term) ||
            s.service_categories?.name?.toLowerCase().includes(term)
        );
    }, [search, services]);

    function openCreate() {
        setEditing(null);
        setFTitle(""); setFDesc(""); setFPrice("0"); setFDuration("60"); setFCategory(""); setFImageUrl("");
        setFormOpen(true);
    }

    function openEdit(s: ServiceRow) {
        setEditing(s);
        setFTitle(s.title);
        setFDesc(s.description ?? "");
        setFPrice(String(s.price));
        setFDuration(String(s.duration_minutes ?? 60));
        setFCategory(s.category_id ?? "");
        setFImageUrl(s.image_url ?? "");
        setFormOpen(true);
    }

    async function save() {
        if (!fTitle.trim()) { toast.error("Title is required"); return; }
        const price = Number(fPrice);
        if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a valid hourly rate"); return; }
        const duration = parseInt(fDuration);
        if (isNaN(duration) || duration < 15) { toast.error("Minimum duration is 15 minutes"); return; }

        setSaving(true);
        const payload: any = {
            title: fTitle.trim(),
            description: fDesc.trim() || null,
            price,
            duration_minutes: duration,
            category_id: fCategory || null,
            image_url: fImageUrl.trim() || null,
        };

        const { error } = editing
            ? await supabase.from("services").update(payload).eq("id", editing.id)
            : await supabase.from("services").insert(payload);

        setSaving(false);
        if (error) { toast.error(error.message); return; }

        toast.success(editing ? "Service updated" : "Service created");
        setFormOpen(false);
        setEditing(null);
        load();
    }

    async function deleteService() {
        if (!editing) return;
        setDeleting(true);
        const { error } = await supabase.from("services").delete().eq("id", editing.id);
        setDeleting(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Service deleted");
        setDeleteDialogOpen(false);
        setEditing(null);
        load();
    }

    async function toggleActive(serviceId: string, nextValue: boolean) {
        const { error } = await supabase.from("services").update({ is_active: nextValue }).eq("id", serviceId);
        if (error) return toast.error(error.message);
        setServices((current) => current.map((s) => s.id === serviceId ? { ...s, is_active: nextValue } : s));
    }

    return (
        <DashboardLayout role="admin">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Services</h1>
                    <p className="text-muted-foreground mt-1">Create, edit, and manage platform services.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-64" />
                    </div>
                    <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Service</Button>
                </div>
            </div>

            <Card className="p-5">
                {loading ? (
                    <p className="text-muted-foreground py-8 text-center">Loading services…</p>
                ) : filtered.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">No services found</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Hourly Rate</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{s.service_categories?.name ?? "—"}</TableCell>
                                    <TableCell>${Number(s.price).toFixed(2)}/hr</TableCell>
                                    <TableCell>{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</TableCell>
                                    <TableCell>
                                        <Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{new Date(s.updated_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => { setEditing(s); setDeleteDialogOpen(true); }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); setEditing(null); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Service" : "New Service"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Title</Label>
                            <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="e.g. Standard Home Cleaning" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={3} placeholder="Brief description of the service…" />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select value={fCategory || "none"} onValueChange={(v) => setFCategory(v === "none" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No category</SelectItem>
                                    {categories
                                        .filter((c) => !!c.id && String(c.id).trim() !== "")
                                        .map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Hourly Rate ($/hr)</Label>
                                <Input type="number" min="0" step="0.01" value={fPrice} onChange={(e) => setFPrice(e.target.value)} />
                            </div>
                            <div>
                                <Label>Duration (minutes)</Label>
                                <Input type="number" min="15" step="15" value={fDuration} onChange={(e) => setFDuration(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <Label>Image URL (optional)</Label>
                            <Input value={fImageUrl} onChange={(e) => setFImageUrl(e.target.value)} placeholder="https://…" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => { setFormOpen(false); setEditing(null); }} disabled={saving}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={save} disabled={saving}>
                                {saving ? "Saving…" : editing ? "Save Changes" : "Create Service"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{editing?.title}</strong>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setEditing(null); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteService} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                            {deleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
