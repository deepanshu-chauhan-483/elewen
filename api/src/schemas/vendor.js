import Joi from 'joi'

export const registerVendorSchema = Joi.object({
  business_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Business name must be at least 2 characters',
    'any.required': 'Business name is required',
  }),
  contact_person_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Contact person name must be at least 2 characters',
    'any.required': 'Contact person name is required',
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
  operating_location: Joi.string().max(200).allow('', null).optional(),
  service_category: Joi.alternatives()
    .try(Joi.array().items(Joi.string()).min(1), Joi.string().min(1))
    .required()
    .messages({
      'any.required': 'At least one service category is required',
    }),
  event_types: Joi.alternatives()
    .try(Joi.array().items(Joi.string()).min(1), Joi.string().min(1))
    .required()
    .messages({
      'any.required': 'At least one event type is required',
    }),
  website_social_portfolio: Joi.string().min(3).max(300).required().messages({
    'any.required': 'Website or social portfolio link is required',
  }),
  established_in: Joi.string().max(10).allow('', null).optional(),
  portfolio_link: Joi.string().max(300).allow('', null).optional(),
  experience_years: Joi.alternatives()
    .try(Joi.number().integer().min(0).max(100), Joi.string().allow('', null))
    .optional(),
  team_size: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().allow('', null))
    .optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  work_sample: Joi.object().allow(null).optional(),
  verification_document: Joi.object().required().messages({
    'any.required': 'Verification document is required',
  }),
})
