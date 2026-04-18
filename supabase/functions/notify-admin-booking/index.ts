import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const ADMIN_PHONE = '+919092727445';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({ error: 'SMS not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: b, error } = await supabase
      .from('bookings')
      .select('service_name, scheduled_date, scheduled_slot, customer_name, customer_phone, address, price')
      .eq('id', bookingId)
      .maybeSingle();
    if (error || !b) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body =
      `🚗 New Booking!\n` +
      `${b.service_name} — ₹${b.price}\n` +
      `${b.scheduled_date} ${b.scheduled_slot}\n` +
      `${b.customer_name} (${b.customer_phone})\n` +
      `${b.address ?? ''}`;

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: ADMIN_PHONE,
        From: TWILIO_FROM,
        Body: body.slice(0, 1500),
      }),
    });
    const twData = await tw.json();
    if (!tw.ok) {
      console.error('Twilio admin notify error', tw.status, twData);
      return new Response(JSON.stringify({ error: twData?.message || 'SMS failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-admin-booking error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
