import { useMutation } from '@tanstack/react-query'
import { submitPlannerLead } from '../lib/api'

/**
 * Submits an in-house planner enquiry to the Express API.
 *
 * Express route: POST /planner-leads
 * Prisma table:  planner_leads  (custom api schema, Week 1)
 *
 * Schema fields:
 *   full_name, email, phone, city,
 *   event_type, event_date, guest_count, venue_type,
 *   support_types (string[]), vision_notes,
 *   planner_lead_status (default 'new')  — schema deviation: NOT 'status'
 *
 * Usage:
 *   const { mutate, isPending, isSuccess, isError, error } = usePlannerLead()
 *   mutate(formData)
 */
export function usePlannerLead() {
  return useMutation({
    mutationFn: submitPlannerLead,
  })
}
