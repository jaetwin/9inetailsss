import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body as { email?: string; name?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

  if (!BREVO_API_KEY || !BREVO_LIST_ID) {
    // Dev fallback — still returns success so the UI works locally
    console.warn('[subscribe] Brevo env vars not set. Returning dev-mode success.');
    return res.status(200).json({ result: 'success', dev: true });
  }

  const payload: Record<string, unknown> = {
    email: email.trim(),
    listIds: [Number(BREVO_LIST_ID)],
    updateEnabled: true, // re-adds the contact if they were previously removed
  };

  // Optionally split a full name into first/last
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    payload.attributes = {
      FIRSTNAME: parts[0],
      LASTNAME: parts.slice(1).join(' ') || '',
    };
  }

  const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  // 201 = created, 204 = already exists (updated)
  if (brevoRes.status === 201 || brevoRes.status === 204) {
    return res.status(200).json({ result: 'success' });
  }

  // Surface Brevo's error message for debugging
  const errBody = await brevoRes.json().catch(() => ({}));
  console.error('[subscribe] Brevo error:', errBody);
  return res.status(500).json({ error: errBody?.message ?? 'Subscription failed' });
}
