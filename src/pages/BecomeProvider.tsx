import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle } from "lucide-react";

export default function BecomeProvider() {
  const { user, roles, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ business_name: "", bio: "", contact_email: "", contact_phone: "", city: "", zip_code: "" });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setExisting(data); setForm({ business_name: data.business_name, bio: data.bio ?? "", contact_email: data.contact_email ?? "", contact_phone: data.contact_phone ?? "", city: data.city ?? "", zip_code: data.zip_code ?? "" }); }
      setLoading(false);
    });
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    if (existing) {
      const { error } = await supabase.from("providers").update(form).eq("id", existing.id);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      toast.success("Profile updated");
    } else {
      const { error } = await supabase.from("providers").insert({ ...form, user_id: user.id });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      if (!roles.includes("provider")) {
        await supabase.from("user_roles").insert({ user_id: user.id, role: "provider" });
        await refreshRoles();
      }
      toast.success("Application submitted! Awaiting admin approval.");
    }
    setSubmitting(false);
    navigate("/provider");
  }

  if (loading) return <PublicLayout><div className="container py-20 text-center">Loading…</div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="container py-10 max-w-2xl">
        {/* Info banner */}
        <Card className="p-5 mb-6 bg-cyan-50 border-cyan-200">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-cyan-900">How provider assignments work</h3>
              <p className="text-sm text-cyan-700 mt-1">
                Customers book services directly — our admin team assigns jobs to approved providers based on availability and expertise.
                You select which services you can fulfill, and jobs come to you.
              </p>
            </div>
          </div>
        </Card>

        <h1 className="text-3xl font-bold mb-2">{existing ? "Edit provider profile" : "Become a ServiceScout provider"}</h1>
        <p className="text-muted-foreground mb-6">{existing ? `Status: ${existing.status}` : "Tell us about your business to get started."}</p>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Business name *</Label><Input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Describe your services and experience" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>Contact phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City *</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Zip code *</Label><Input required value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} /></div>
            </div>
            <Button type="submit" size="lg" disabled={submitting}>{submitting ? "Submitting…" : existing ? "Save changes" : "Submit application"}</Button>
          </form>
        </Card>
      </div>
    </PublicLayout>
  );
}
