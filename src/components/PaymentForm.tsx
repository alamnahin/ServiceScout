import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ShieldCheck } from "lucide-react";

interface PaymentFormProps {
    amount: number;
    bookingId: string;
    paymentMode: "sale" | "pre_auth";
    onSuccess: (response: any) => void;
    onError: (message: string) => void;
    disabled?: boolean;
}

// PayWay SDK stores the frame on window so it survives HMR/remounts.
function getState(): { frame: any; error: string; initStarted: boolean } {
    if (!(window as any).__paywayState) {
        (window as any).__paywayState = { frame: null, error: "", initStarted: false };
    }
    return (window as any).__paywayState;
}

export default function PaymentForm({
    amount,
    bookingId,
    paymentMode,
    onSuccess,
    onError,
    disabled,
}: PaymentFormProps) {
    const [processing, setProcessing] = useState(false);
    const [frameReady, setFrameReady] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const errorRef = useRef(onError);
    const successRef = useRef(onSuccess);
    const containerRef = useRef<HTMLDivElement>(null);
    errorRef.current = onError;
    successRef.current = onSuccess;

    useEffect(() => {
        const state = getState();
        const globalPaywayDiv = document.getElementById("payway-credit-card");
        const quarantineDiv = document.getElementById("payway-quarantine"); // Grab the wrapper

        // 1. Pull the iframe OUT of quarantine and into your React component
        if (globalPaywayDiv && containerRef.current) {
            containerRef.current.appendChild(globalPaywayDiv);
        }

        if (state.frame) {
            setFrameReady(true);
            return;
        }

        if (state.initStarted) return;
        state.initStarted = true;

        const publishableKey = import.meta.env.VITE_PAYWAY_PUBLISHABLE_KEY;
        const payway = (window as any).payway;

        if (!publishableKey || !payway) {
            state.error = "Payment system is currently unavailable.";
            errorRef.current(state.error);
            return;
        }

        document.querySelectorAll('iframe[src*="payway"], iframe[src*="westpac"]').forEach((el) => el.remove());

        const options = {
            publishableApiKey: publishableKey,
            tokenMode: "callback",
            onValid: () => setIsFormValid(true),
            onInvalid: () => setIsFormValid(false),
            style: {
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: "14px",
                color: "#0f172a",
                backgroundColor: "transparent",
            },
        };

        payway.createCreditCardFrame(options, (err: any, frame: any) => {
            state.frame = frame;
            if (err) {
                console.error("PayWay initialization error:", err);
                state.error = err.message || "Could not load secure payment fields.";
                errorRef.current(state.error);
                return;
            }
            setFrameReady(true);
        });

        return () => {
            // 2. Push the iframe BACK into the hidden quarantine wrapper on unmount
            if (globalPaywayDiv && quarantineDiv) {
                quarantineDiv.appendChild(globalPaywayDiv);
            }
        };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const state = getState();

        if (!state.frame) {
            onError(state.error || "Payment form is not ready yet.");
            return;
        }

        setProcessing(true);

        state.frame.getToken(async (err: any, tokenData: any) => {
            if (err) {
                setProcessing(false);
                onError(err.message || "Failed to generate a secure token.");
                return;
            }

            try {
                const { data, error } = await supabase.functions.invoke("process-payment", {
                    body: {
                        singleUseTokenId: tokenData.singleUseTokenId,
                        amount,
                        bookingId,
                        paymentMode,
                    },
                });

                if (error) {
                    throw new Error(error.message || "Payment processing failed on the server.");
                }

                if (!data) {
                    throw new Error(
                        "No response from payment server. Ensure the Supabase edge function 'process-payment' is deployed."
                    );
                }

                if (!data.success) {
                    throw new Error(data.error || "Transaction declined.");
                }

                onSuccess(data);

            } catch (serverErr: any) {
                console.error("Payment processing error:", serverErr);
                onError(serverErr.message || "Payment processing failed. Please check your card details.");
            } finally {
                setProcessing(false);
            }
        });
    }

    return (
        <Card className="overflow-hidden border-0 p-0 shadow-xl">
            <div className="bg-gradient-to-r from-[#003B5C] to-[#005A8C] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Secure Payment via PayWay</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300">256-bit SSL</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <div className="text-sm text-muted-foreground">Total amount</div>
                    <div className="text-3xl font-bold text-slate-900">${amount.toFixed(2)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {paymentMode === "pre_auth" ? "Funds will be held until capture" : "Charged immediately"}
                    </div>
                </div>

                <div className="min-h-[200px]" ref={containerRef}>
                    {!frameReady && (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground animate-pulse">
                            Loading secure payment fields...
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-[#003B5C] to-[#005A8C] text-base font-semibold text-white shadow-lg hover:from-[#002B4C] hover:to-[#004A7C]"
                    disabled={processing || !frameReady || disabled || !isFormValid}
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                        </span>
                    ) : (
                        `${paymentMode === "pre_auth" ? "Authorise" : "Pay"} $${amount.toFixed(2)}`
                    )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Card details are encrypted and never stored on our servers</span>
                </div>
            </form>
        </Card>
    );
}
