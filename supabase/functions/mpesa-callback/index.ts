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

    // Tuma callback format
    const {
      payment_id,
      merchant_request_id,
      status,
      mpesa_receipt_number,
    } = body;

    const lookupId = payment_id || merchant_request_id;

    if (!lookupId) {
      // Fallback: try Daraja-style callback format
      const callback = body?.Body?.stkCallback;
      if (callback) {
        const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;
        if (ResultCode === 0) {
          let mpesaReceipt = "";
          if (CallbackMetadata?.Item) {
            const receiptItem = CallbackMetadata.Item.find(
              (item: any) => item.Name === "MpesaReceiptNumber"
            );
            mpesaReceipt = receiptItem?.Value || "";
          }
          await supabase
            .from("bid_fee_payments")
            .update({ status: "completed", mpesa_receipt: mpesaReceipt })
            .eq("checkout_request_id", CheckoutRequestID);
        } else {
          await supabase
            .from("bid_fee_payments")
            .update({ status: "failed" })
            .eq("checkout_request_id", CheckoutRequestID);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid callback payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tuma callback handling
    if (status === "completed" || status === "success") {
      await supabase
        .from("bid_fee_payments")
        .update({
          status: "completed",
          mpesa_receipt: mpesa_receipt_number || "",
        })
        .eq("checkout_request_id", lookupId);
    } else {
      await supabase
        .from("bid_fee_payments")
        .update({ status: "failed" })
        .eq("checkout_request_id", lookupId);
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
