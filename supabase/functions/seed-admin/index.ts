import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingUsers } = await supabase.auth.admin.listUsers();

    const admins = [
      { email: "macknonvulimu@gmail.com", password: "Macknon@2025", name: "Admin User" },
      { email: "kaziplug1@gmail.com", password: "#kaziplug9575", name: "KaziPlug Admin" },
    ];

    const results = [];
    for (const admin of admins) {
      const exists = existingUsers?.users?.some((u) => u.email === admin.email);
      if (exists) {
        results.push({ email: admin.email, status: "already exists" });
        continue;
      }

      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: { full_name: admin.name, role: "admin" },
      });

      if (createError) {
        results.push({ email: admin.email, status: "error", error: createError.message });
      } else {
        results.push({ email: admin.email, status: "created", user_id: userData.user?.id });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
