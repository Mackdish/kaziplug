import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEXTGIG_SUCCESS_URL = "https://nextgig.co.ke/payment/success";
const NEXTGIG_CANCEL_URL = "https://nextgig.co.ke/payment/cancelled";

function formatKenyanPhone(phoneNumber: string): string {
  let phone = phoneNumber.trim().replace(/\s+/g, "");
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("0")) phone = `254${phone.slice(1)}`;
  if (!phone.startsWith("254")) phone = `254${phone}`;
  if (!/^254(?:7|1)\d{8}$/.test(phone)) {
    throw new Error("Please provide a valid Kenyan phone number.");
  }
  return phone;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

async function requestPayza(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === 2) return response;
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("PayzaAPI request failed.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, task_id, user_id, payment_id, amount, payment_type } = await req.json();
    const type = payment_type || "bid_fee";
    const payAmount = Number(amount || 30);

    if (!phone_number || !task_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid payment amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicKey = (Deno.env.get("PAYZA_PUBLIC_KEY") || "").trim();
    const secretKey = (Deno.env.get("PAYZA_SECRET_KEY") || "").trim();
    if (!publicKey || !secretKey) {
      throw new Error("PayzaAPI credentials are not configured. Add PAYZA_PUBLIC_KEY and PAYZA_SECRET_KEY to Supabase secrets.");
    }

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server credentials are not configured.");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(user_id);
    if (authUserError || !authUser?.user?.email) {
      throw new Error("The customer's verified email address could not be found.");
    }

    const formattedPhone = formatKenyanPhone(phone_number);
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;
    const referencePrefix = type === "task_payment" ? "KAZI-TASK" : "KAZI-BID";
    const reference = `${referencePrefix}-${payment_id || task_id}-${Date.now()}`.slice(0, 64);
    const customerName = String(
      authUser.user.user_metadata?.full_name ||
      authUser.user.user_metadata?.name ||
      "Kaziplug Customer"
    ).slice(0, 100);

    const baseUrl = (Deno.env.get("PAYZA_BASE_URL") || "https://payzaapi.co.ke").replace(/\/$/, "");
    const response = await requestPayza(`${baseUrl}/api/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Public-Key": publicKey,
        "X-Secret-Key": secretKey,
      },
      body: JSON.stringify({
        amount: payAmount,
        currency: "KES",
        stk_push: true,
        reference,
        customer: {
          phone: formattedPhone,
          name: customerName,
          email: authUser.user.email,
        },
        callback_url: callbackUrl,
        redirect_url: NEXTGIG_SUCCESS_URL,
        cancel_url: NEXTGIG_CANCEL_URL,
        description: (type === "task_payment" ? "NextGig task payment" : "NextGig bid fee").slice(0, 100),
        metadata: {
          user_id,
          task_id,
          payment_id: payment_id || null,
          payment_type: type,
          reference,
          platform: "nextgig.co.ke",
        },
      }),
    });

    const raw = await response.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = { success: false, message: raw || "Invalid PayzaAPI response" }; }

    console.log("PayzaAPI response status:", response.status, "success:", Boolean(data?.success));

    if (!response.ok || !data?.success) {
      const providerUnavailable = RETRYABLE_STATUSES.has(response.status) || raw.trimStart().startsWith("<!DOCTYPE html");
      return new Response(JSON.stringify({
        error: providerUnavailable
          ? "M-Pesa payment service is temporarily unavailable. Please try again in a few minutes."
          : data?.message || data?.error || `Payment request failed with status ${response.status}`,
      }), {
        status: providerUnavailable ? 503 : (response.status >= 400 ? response.status : 502),
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerReference = String(data?.data?.reference || data?.reference || reference);

    if (type === "task_payment" && payment_id) {
      const { error } = await supabase.from("transactions")
        .update({ checkout_request_id: providerReference }).eq("id", payment_id);
      if (error) throw new Error("Payment started, but the transaction reference could not be saved.");
    } else if (payment_id) {
      const { error } = await supabase.from("bid_fee_payments")
        .update({ checkout_request_id: providerReference }).eq("id", payment_id);
      if (error) throw new Error("Payment started, but the payment reference could not be saved.");
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_request_id: providerReference,
      reference: providerReference,
      payment_url: data?.data?.payment_url || data?.payment_url || null,
      status: data?.data?.status || data?.status || "pending",
      stk_sent: Boolean(data?.data?.stk_sent),
      redirect_url: NEXTGIG_SUCCESS_URL,
      cancel_url: NEXTGIG_CANCEL_URL,
      message: data?.message || "STK push sent. Check your phone.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = errorMessage(error);
    console.error("PayzaAPI payment error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});