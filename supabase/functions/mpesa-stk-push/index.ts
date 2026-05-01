import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getTumaAccessToken(): Promise<string> {
  const email = Deno.env.get("TUMA_EMAIL")!;
  const apiKey = Deno.env.get("TUMA_API_KEY")!;

  const res = await fetch("https://api.tuma.co.ke/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, api_key: apiKey }),
  });

  const rawBody = await res.text();
  if (!res.ok) {
    throw new Error(`Tuma auth failed: ${res.status} ${rawBody}`);
  }
  const data = JSON.parse(rawBody);
  const token = data?.data?.token || data?.token;
  if (!token) throw new Error(`No token in Tuma response: ${rawBody}`);
  return token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, task_id, user_id, payment_id, amount, payment_type } = await req.json();

    // payment_type: "bid_fee" (default) or "task_payment"
    const type = payment_type || "bid_fee";
    const payAmount = amount || 30;

    if (!phone_number || !task_id || !user_id) {
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

    const accessToken = await getTumaAccessToken();
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

    const descPrefix = type === "task_payment" ? "TaskPay" : "BidFee";
    const refId = payment_id ? payment_id.substring(0, 8) : task_id.substring(0, 8);

    console.log("Sending STK push:", { phone: formattedPhone, amount: payAmount, type, callbackUrl });

    const stkRes = await fetch("https://api.tuma.co.ke/payment/stk-push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: payAmount,
        phone: formattedPhone,
        callback_url: callbackUrl,
        description: `${descPrefix}-${refId}`,
      }),
    });

    const stkData = await stkRes.json();
    console.log("Tuma STK response:", JSON.stringify(stkData));

    if (stkData.success || stkData.data) {
      const d = stkData.data || stkData;
      const checkoutId = d.checkout_request_id || d.merchant_request_id || stkData.checkout_request_id || stkData.merchant_request_id;
      console.log("Storing checkoutId:", checkoutId, "for type:", type);

      if (!checkoutId) {
        console.error("Tuma returned success but no checkout_request_id:", JSON.stringify(stkData));
        return new Response(
          JSON.stringify({ error: "Payment provider did not return a checkout reference. Please try again.", details: stkData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (type === "task_payment" && payment_id) {
        // Update transaction record with checkout_request_id
        await supabase
          .from("transactions")
          .update({ checkout_request_id: checkoutId })
          .eq("id", payment_id);
      } else if (payment_id) {
        // Update bid_fee_payments record
        await supabase
          .from("bid_fee_payments")
          .update({ checkout_request_id: checkoutId })
          .eq("id", payment_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          checkout_request_id: checkoutId,
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
    console.error("STK push error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
