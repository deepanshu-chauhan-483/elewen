import { useMutation } from '@tanstack/react-query'
import { submitConsultation } from '../lib/api'

/**
 * Submits a Book a Consultation enquiry to the Express API.
 *
 * Express route: POST /consultations
 * Strapi table:  planner_leads (lead_type = 'consultation')
 *
 * Required fields: full_name, email, phone
 * Optional: event_type, event_date, guest_count, city, budget_range, vision_notes
 *
 * Usage:
 *   const { mutate, isPending, isSuccess, isError } = useConsultation()
 *   mutate(formData)
 */
export function useConsultation() {
  return useMutation({
    mutationFn: submitConsultation,
  })
}
