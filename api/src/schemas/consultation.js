import Joi from 'joi'

export const createConsultationSchema = Joi.object({
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
  event_type: Joi.string().max(100).allow('', null).optional(),
  event_date: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': 'Enter a valid date (YYYY-MM-DD)',
  }),
  guest_count: Joi.alternatives()
    .try(Joi.string().max(20), Joi.number().integer().min(1))
    .allow('', null)
    .optional(),
  city: Joi.string().max(100).allow('', null).optional(),
  budget_range: Joi.string().max(100).allow('', null).optional(),
  vision_notes: Joi.string().max(2000).allow('', null).optional(),
  interested_package_id: Joi.string().max(100).allow('', null).optional(),
  interested_package_title: Joi.string().max(255).allow('', null).optional(),
  interested_package_slug: Joi.string().max(255).allow('', null).optional(),
  interest_source: Joi.string().max(100).allow('', null).optional(),
})
