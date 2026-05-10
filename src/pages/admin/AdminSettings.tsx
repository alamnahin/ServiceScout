import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreditCard, DollarSign, Settings } from "lucide-react";

export default function AdminSettings() {
  const [s, setS] = useState({
    commission_rate: "10",
    currency: "USD",
    currency_symbol: "$",
    site_name: "ServiceScout",
    payment_mode: "sale" as "sale" | "pre_auth",
    payway_merchant_id: import.meta.env.VITE_PAYWAY_MERCHANT_ID ?? "",
    payway_test_mode: "true",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setS({
          commission_rate: String(data.commission_rate ?? 10),
          currency: data.currency ?? "USD",
          currency_symbol: data.currency_symbol ?? "$",
          site_name: data.site_name ?? "ServiceScout",
          payment_mode: data.payment_mode === "pre_auth" ? "pre_auth" : "sale",
          payway_merchant_id: data.payway_merchant_id ?? "",
          payway_test_mode: data.payway_test_mode ? "true" : "false",
        });
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    const { error } = await supabase.from("platform_settings").update({
      commission_rate: Number(s.commission_rate),
      currency: s.currency,
      currency_symbol: s.currency_symbol,
      site_name: s.site_name,
      payment_mode: s.payment_mode,
      payway_merchant_id: s.payway_merchant_id,
      payway_test_mode: s.payway_test_mode === "true",
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  if (loading) return <DashboardLayout role="admin"><div className="text-center py-20 text-muted-foreground">Loading…</div></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <h1 className="text-3xl font-bold mb-6">Platform settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* General */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Settings className="h-5 w-5" /> General</h2>
          <Separator />
          <div>
            <Label>Site name</Label>
            <Input value={s.site_name} onChange={(e) => setS({ ...s, site_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency</Label>
              <Input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input value={s.currency_symbol} onChange={(e) => setS({ ...s, currency_symbol: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Commission rate (%)</Label>
            <Input type="number" step="0.5" value={s.commission_rate} onChange={(e) => setS({ ...s, commission_rate: e.target.value })} />
          </div>
        </Card>

        {/* Payment Gateway */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5" /> PayWay Payment Gateway</h2>
          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Payment Mode</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {s.payment_mode === "sale" ? "Charge immediately at booking" : "Authorise at booking, capture after service"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${s.payment_mode === "sale" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>Sale</span>
              <Switch
                checked={s.payment_mode === "pre_auth"}
                onCheckedChange={(checked) => setS({ ...s, payment_mode: checked ? "pre_auth" : "sale" })}
              />
              <span className={`text-xs px-2 py-1 rounded-full ${s.payment_mode === "pre_auth" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>Pre-auth</span>
            </div>
          </div>

          <div>
            <Label>PayWay Merchant ID</Label>
            <Input value={s.payway_merchant_id} onChange={(e) => setS({ ...s, payway_merchant_id: e.target.value })} placeholder="Your merchant ID" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Test Mode</Label>
              <p className="text-sm text-muted-foreground mt-1">Use PayWay sandbox for testing</p>
            </div>
            <Switch
              checked={s.payway_test_mode === "true"}
              onCheckedChange={(checked) => setS({ ...s, payway_test_mode: checked ? "true" : "false" })}
            />
          </div>
        </Card>

        <Button onClick={save} className="w-fit">Save all settings</Button>
      </div>
    </DashboardLayout>
  );
}
