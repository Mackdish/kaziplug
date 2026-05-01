import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Tuma callback received:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Tuma may nest payload under .data
    const payload = body?.data ?? body;
    const {
      checkout_request_id,
      merchant_request_id,
      status,
      mpesa_receipt_number,
      result_code,
      ResultCode,
    } = payload;

    const lookupId = checkout_request_id || merchant_request_id;

    if (!lookupId) {
      console.error("No checkout_request_id or merchant_request_id in callback:", JSON.stringify(body));
      return new Response(JSON.stringify({ error: "Invalid callback payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedStatus = String(status ?? "").toLowerCase();
    const code = result_code ?? ResultCode;
    // Treat as success if status indicates success OR M-Pesa ResultCode is 0 OR a receipt was issued
    const isSuccess =
      ["completed", "success", "successful", "paid"].includes(normalizedStatus) ||
      code === 0 ||
      code === "0" ||
      Boolean(mpesa_receipt_number);

    console.log(`Processing callback: lookupId=${lookupId}, status=${status}, code=${code}, receipt=${mpesa_receipt_number}, isSuccess=${isSuccess}`);

    // Try to update bid_fee_payments first
    const { data: bidPayment } = await supabase
      .from("bid_fee_payments")
      .select("id")
      .eq("checkout_request_id", lookupId)
      .maybeSingle();

    if (bidPayment) {
      const { error } = await supabase
        .from("bid_fee_payments")
        .update({
          status: isSuccess ? "completed" : "failed",
          mpesa_receipt: isSuccess ? (mpesa_receipt_number || "") : null,
        })
        .eq("checkout_request_id", lookupId);

      if (error) {
        console.error("Failed to update bid_fee_payment:", error);
      } else {
        console.log(`Bid fee payment marked as ${isSuccess ? "completed" : "failed"} for:`, lookupId);
      }
    }

    // Try to update transactions (task payments)
    const { data: transaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("checkout_request_id", lookupId)
      .maybeSingle();

    if (transaction) {
      const { error } = await supabase
        .from("transactions")
        .update({
          escrow_status: isSuccess ? "held" : "refunded",
          external_reference: isSuccess ? (mpesa_receipt_number || "") : null,
        })
        .eq("checkout_request_id", lookupId);

      if (error) {
        console.error("Failed to update transaction:", error);
      } else {
        console.log(`Transaction marked as ${isSuccess ? "held" : "refunded"} for:`, lookupId);
      }
    }

    if (!bidPayment && !transaction) {
      console.warn("No matching payment found for checkout_request_id:", lookupId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
