import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("PayzaAPI callback received:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = body?.data ?? body;
    const reference = payload?.reference || payload?.transaction_reference || payload?.payment_reference;
    const status = String(payload?.status || payload?.payment_status || "").toLowerCase();
    const receipt = payload?.mpesa_receipt || payload?.mpesa_receipt_number || payload?.receipt || payload?.receipt_number || null;

    if (!reference) {
      console.error("PayzaAPI callback missing reference:", JSON.stringify(body));
      return new Response(JSON.stringify({ error: "Invalid callback payload: missing reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSuccess = ["success", "successful", "completed", "complete", "paid", "succeeded"].includes(status) || payload?.success === true;
    const isFailure = ["failed", "failure", "cancelled", "canceled", "rejected", "declined", "expired"].includes(status);

    if (!isSuccess && !isFailure) {
      console.log("PayzaAPI callback is still pending:", { reference, status });
      return new Response(JSON.stringify({ success: true, status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bidPayment = await supabase.from("bid_fee_payments")
      .select("id").eq("checkout_request_id", reference).maybeSingle();

    if (bidPayment.data) {
      const { error } = await supabase.from("bid_fee_payments")
        .update({ status: isSuccess ? "completed" : "failed", mpesa_receipt: isSuccess ? (receipt || "") : null })
        .eq("checkout_request_id", reference);
      if (error) console.error("Failed to update bid fee payment:", error);
    }

    const transaction = await supabase.from("transactions")
      .select("id").eq("checkout_request_id", reference).maybeSingle();

    if (transaction.data) {
      const { error } = await supabase.from("transactions")
        .update({
          escrow_status: isSuccess ? "held" : "refunded",
          external_reference: isSuccess ? (receipt || reference) : null,
        })
        .eq("checkout_request_id", reference);
      if (error) console.error("Failed to update transaction:", error);
    }

    if (!bidPayment.data && !transaction.data) {
      console.warn("No Kaziplug payment matched PayzaAPI reference:", reference);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PayzaAPI callback error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});