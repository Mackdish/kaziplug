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

    // Tuma callback format:
    // { merchant_request_id, checkout_request_id, status, message, amount, mpesa_receipt_number, transaction_date, phone_number }
    const {
      checkout_request_id,
      merchant_request_id,
      status,
      mpesa_receipt_number,
    } = body;

    const lookupId = checkout_request_id || merchant_request_id;

    if (!lookupId) {
      console.error("No checkout_request_id or merchant_request_id in callback:", JSON.stringify(body));
      return new Response(JSON.stringify({ error: "Invalid callback payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing callback: lookupId=${lookupId}, status=${status}, receipt=${mpesa_receipt_number}`);

    if (status === "completed" || status === "success") {
      const { error } = await supabase
        .from("bid_fee_payments")
        .update({
          status: "completed",
          mpesa_receipt: mpesa_receipt_number || "",
        })
        .eq("checkout_request_id", lookupId);

      if (error) {
        console.error("Failed to update payment to completed:", error);
      } else {
        console.log("Payment marked as completed for:", lookupId);
      }
    } else {
      const { error } = await supabase
        .from("bid_fee_payments")
        .update({ status: "failed" })
        .eq("checkout_request_id", lookupId);

      if (error) {
        console.error("Failed to update payment to failed:", error);
      } else {
        console.log("Payment marked as failed for:", lookupId);
      }
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
