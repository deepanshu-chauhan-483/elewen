import Joi from 'joi'

export const createPlannerLeadSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian phone number',
      'any.required': 'Phone number is required',
    }),
  city: Joi.string().min(2).max(100).required().messages({
    'any.required': 'City is required',
  }),
  event_type: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Event type is required',
  }),
  guest_count: Joi.alternatives()
    .try(Joi.string().min(1).max(30), Joi.number().integer().min(1))
    .required()
    .messages({
      'any.required': 'Guest count is required',
    }),
  venue_type: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Venue type is required',
  }),
  event_date: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': 'Enter a valid date (YYYY-MM-DD)',
  }),
  support_types: Joi.array().items(Joi.string()).allow(null).optional(),
  vision_notes: Joi.string().max(2000).allow('', null).optional(),
})
