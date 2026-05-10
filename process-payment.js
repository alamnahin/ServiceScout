import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const PAYWAY_API_URL = "https://api.payway.com.au/rest/v1/transactions";

// Shared helper so every response matches the shape the client expects.
// PayWay may return HTTP 200 with status:"declined" — handle that as failure.
function paywayEnvelope(result) {
    const isDeclined = result.status === "declined";
    return {
        success: !isDeclined,
        transaction: {
            transactionId: result.transactionId?.toString() ?? null,
            receiptNumber: result.receiptNumber?.toString() ?? null,
            responseCode: result.responseCode ?? (isDeclined ? "05" : "00"),
            responseMessage: result.responseText ?? (isDeclined ? "Card declined" : "Approved"),
            timestamp: new Date().toISOString(),
        },
        response: result,
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();

        // ── Capture / Refund routing ─────────────────────────────────────
        if (payload.action === "capture" || payload.action === "refund") {
            const { bookingId, originalTransactionId, amount } = payload;
            if (!originalTransactionId || !amount || !bookingId) {
                throw new Error(`Missing fields for ${payload.action}`);
            }

            const secretKey = Deno.env.get("PAYWAY_SECRET_KEY");
            if (!secretKey) throw new Error("PAYWAY_SECRET_KEY not configured");
            const authHeader = `Basic ${btoa(`${secretKey}:`)}`;

            const actionUrl = `${PAYWAY_API_URL}/${originalTransactionId}/${payload.action === "capture" ? "capture" : "refund"}`;
            const body = new URLSearchParams({
                principalAmount: Number(amount).toFixed(2),
                currency: "aud",
            });

            const response = await fetch(actionUrl, {
                method: "POST",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
                body,
            });

            const result = await response.json();

            if (!response.ok) {
                const msg =
                    result?.data?.[0]?.message ||
                    result?.errors?.[0]?.message ||
                    result?.message ||
                    `${payload.action} failed`;
                return new Response(
                    JSON.stringify({ success: false, transaction: { transactionId: "", receiptNumber: "", responseCode: "error", responseMessage: msg }, error: msg }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Log to payment_transactions
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL"),
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
            );

            const txnType = payload.action === "capture" ? "capture" : "refund";
            await supabase.from("payment_transactions").insert({
                booking_id: bookingId,
                payway_transaction_id: result.transactionId?.toString() ?? originalTransactionId,
                transaction_type: txnType,
                amount,
                status: "success",
                response_code: result.responseCode ?? "00",
                response_message: result.responseText ?? txnType,
                raw_response: result,
            });

            return new Response(
                JSON.stringify(paywayEnvelope(result)),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── Purchase / Pre-authorisation ─────────────────────────────────
        const { singleUseTokenId, amount, paymentMode } = payload;

        if (!singleUseTokenId) throw new Error("Missing singleUseTokenId");

        const secretKey = Deno.env.get("PAYWAY_SECRET_KEY");
        if (!secretKey) throw new Error("PAYWAY_SECRET_KEY not configured");

        const merchantId = Deno.env.get("PAYWAY_MERCHANT_ID") ?? "TEST";
        const authHeader = `Basic ${btoa(`${secretKey}:`)}`;

        const body = new URLSearchParams({
            singleUseTokenId,
            merchantId,
            customerNumber: "00000000000000000000",
            principalAmount: Number(amount).toFixed(2),
            currency: "aud",
            transactionType: paymentMode === "pre_auth" ? "preAuth" : "payment",
        });

        const response = await fetch(PAYWAY_API_URL, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body,
        });

        const result = await response.json();
        console.log("PAYWAY RESPONSE:", JSON.stringify(result, null, 2));

        // ── PayWay returned an error ──────────────────────────────────────
        if (!response.ok) {
            const errorMessage =
                result?.data?.[0]?.message ||
                result?.errors?.[0]?.message ||
                result?.message ||
                "Payment failed";

            return new Response(
                JSON.stringify({
                    success: false,
                    transaction: { transactionId: "", receiptNumber: "", responseCode: "error", responseMessage: errorMessage },
                    error: errorMessage,
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── PayWay success ────────────────────────────────────────────────
        // Note: booking + payment_transactions are created client-side after this response.
        // This avoids a double-insert and ensures the real booking ID is recorded correctly.

        return new Response(
            JSON.stringify(paywayEnvelope(result)),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("PAYMENT ERROR:", error);
        return new Response(
            JSON.stringify({
                success: false,
                transaction: { transactionId: "", receiptNumber: "", responseCode: "error", responseMessage: error instanceof Error ? error.message : "Unknown error" },
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});