import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(p: string): string {
  const trimmed = p.trim().replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
}

// Build a deterministic placeholder email so each phone maps to the same auth user
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `phone_${digits}@phone.local`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Phone and code required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalized = normalizePhone(phone);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find latest unconsumed OTP for this phone
    const { data: otp, error: fetchErr } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', normalized)
      .eq('consumed', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!otp) {
      return new Response(JSON.stringify({ error: 'Code expired or not found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({ error: 'Too many attempts' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const codeHash = await sha256(code);
    if (codeHash !== otp.code_hash) {
      await supabase.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      return new Response(JSON.stringify({ error: 'Incorrect code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark consumed
    await supabase.from('phone_otps').update({ consumed: true }).eq('id', otp.id);

    const placeholderEmail = phoneToEmail(normalized);
    const password = crypto.randomUUID() + crypto.randomUUID(); // ephemeral, per-login

    // Try create user; if exists, update password so we can sign in
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: placeholderEmail,
      password,
      email_confirm: true,
      phone: normalized,
      user_metadata: {
        full_name: otp.full_name ?? '',
        phone: normalized,
      },
    });

    let userId: string | undefined = created?.user?.id;

    if (createErr) {
      // User exists -> find by email and update password
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === placeholderEmail);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Account lookup failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, { password });
    }

    // Ensure profile reflects phone + name (for first-time)
    if (userId) {
      await supabase.from('profiles').upsert(
        {
          user_id: userId,
          phone: normalized,
          full_name: otp.full_name ?? undefined,
        },
        { onConflict: 'user_id' },
      );
    }

    // Return creds for the client to call signInWithPassword
    return new Response(
      JSON.stringify({ success: true, email: placeholderEmail, password }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('verify-sms-otp error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
