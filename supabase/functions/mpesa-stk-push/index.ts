import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getTumaApiKey(): string {
  return Deno.env.get("TUMA_API_KEY")!;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, task_id, user_id, payment_id } = await req.json();

    if (!phone_number || !task_id || !user_id || !payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number to 254... format
    let formattedPhone = phone_number.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = `254${formattedPhone}`;
    }

    const apiKey = getTumaApiKey();
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

    const stkRes = await fetch("https://api.tuma.co.ke/payment/stk-push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 55,
        phone: formattedPhone,
        callback_url: callbackUrl,
        description: `BidFee-${payment_id.substring(0, 8)}`,
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.success) {
      // Update payment record with Tuma payment ID
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("bid_fee_payments")
        .update({ checkout_request_id: stkData.payment_id || stkData.merchant_request_id })
        .eq("id", payment_id);

      return new Response(
        JSON.stringify({
          success: true,
          checkout_request_id: stkData.payment_id || stkData.merchant_request_id,
          message: "STK push sent. Check your phone.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: stkData.message || "STK push failed", details: stkData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
