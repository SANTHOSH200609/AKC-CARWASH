import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(p: string): string {
  const trimmed = p.trim().replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  // Default to India country code if 10 digits given without +
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, fullName } = await req.json();
    if (!phone || typeof phone !== 'string') {
      return new Response(JSON.stringify({ error: 'Phone required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalized = normalizePhone(phone);
    if (!/^\+\d{8,15}$/.test(normalized)) {
      return new Response(JSON.stringify({ error: 'Invalid phone format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({ error: 'SMS service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Rate limit: max 3 unconsumed OTPs in the last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await supabase
      .from('phone_otps')
      .select('id', { count: 'exact', head: true })
      .eq('phone', normalized)
      .gte('created_at', tenMinAgo);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

    const { error: insErr } = await supabase.from('phone_otps').insert({
      phone: normalized,
      code_hash: codeHash,
      full_name: fullName ?? null,
      expires_at: expiresAt,
    });
    if (insErr) throw insErr;

    // Send via Twilio
    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: normalized,
        From: TWILIO_FROM,
        Body: `Your Car Wash login code is ${code}. Valid for 5 minutes.`,
      }),
    });
    const twData = await tw.json();
    if (!tw.ok) {
      console.error('Twilio error', tw.status, twData);
      return new Response(JSON.stringify({ error: twData?.message || 'SMS send failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, phone: normalized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-sms-otp error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
