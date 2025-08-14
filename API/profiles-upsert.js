# make the serverless functions folder
mkdir -p api

# create the upsert function file
cat > api/profiles-upsert.js <<'EOF'
/**
 * Vercel Serverless Function: /api/profiles-upsert
 * - Safe to call from the browser or Voiceflow
 * - Uses Supabase REST API (no ESM import issues)
 * - Upserts into "profiles" by id
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPA_URL = process.env.REACT_APP_SUPABASE_URL;
    const SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;

    if (!SUPA_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    // Expect JSON body: { id, first_name, email, session_id, last_session_date }
    const payload = req.body || {};
    if (!payload.id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    const endpoint = `${SUPA_URL}/rest/v1/profiles?on_conflict=id`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // merge-duplicates = upsert, return=representation returns the row back
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });

    // Supabase returns 201/200 on success, 4xx/5xx on error
    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.message || text || 'Unknown Supabase error',
        status: resp.status
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('profiles-upsert error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
EOF