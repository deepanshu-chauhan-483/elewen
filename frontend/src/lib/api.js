/**
 * Custom Express API client (Week 3+ features).
 *
 * Handles: bookings, payments, cart, planner lead submissions,
 * messaging, support tickets, notifications.
 *
 * Base URL: VITE_API_URL (default localhost:4000, proxied via nginx in prod)
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`API ${res.status} on ${method} ${path}: ${msg}`)
  }

  return res.json()
}

export const apiGet  = (path)        => request('GET',    path)
export const apiPost = (path, body)  => request('POST',   path, body)
export const apiPut  = (path, body)  => request('PUT',    path, body)
export const apiDel  = (path)        => request('DELETE', path)

/* ── Planner Lead ─────────────────────────────────────────────────────────── */

/**
 * Submit an in-house planner enquiry.
 * Maps to POST /planner-leads in the Express API.
 *
 * @param {Object} lead
 * @param {string} lead.full_name
 * @param {string} lead.email
 * @param {string} lead.phone
 * @param {string} lead.city
 * @param {string} lead.event_type
 * @param {string} lead.event_date
 * @param {string} lead.guest_count
 * @param {string} lead.venue_type
 * @param {string[]} lead.support_types   - e.g. ['Decor & Styling', 'Catering']
 * @param {string} lead.vision_notes
 */
export function submitPlannerLead(lead) {
  return apiPost('/planner-leads', lead)
}
