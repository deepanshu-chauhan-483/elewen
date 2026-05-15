import Joi from 'joi'

export const createContactSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required',
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
  message: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'Message must be at least 10 characters',
    'any.required': 'Message is required',
  }),
})
