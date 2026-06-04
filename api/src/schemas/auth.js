import Joi from 'joi'
import { isValidIndianPhone, normalizeIndianPhone } from '../utils/phone.js'

const indianPhoneJoi = ({ required = false } = {}) => {
  let field = Joi.string().custom((value, helpers) => {
    if (value === null || value === undefined) return value
    const normalized = normalizeIndianPhone(value)
    if (normalized === '') return ''
    if (!isValidIndianPhone(normalized)) {
      return helpers.error('string.pattern.base')
    }
    return normalized
  })

  field = field.messages({
    'string.pattern.base': 'Enter a valid 10-digit Indian phone number',
    ...(required ? { 'any.required': 'Phone number is required' } : {}),
  })

  return required ? field.required() : field.allow('', null)
}

export const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name must be at most 50 characters',
    'any.required': 'First name is required',
  }),
  last_name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name must be at most 50 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
  phone: indianPhoneJoi({ required: true }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required',
  }),
})

export const resetPasswordSchema = Joi.object({
  code: Joi.string().required().messages({
    'any.required': 'Reset code is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  passwordConfirmation: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
})

export const updateProfileSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters',
    'string.empty': 'First name cannot be empty',
  }),
  last_name: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.empty': 'Last name cannot be empty',
  }),
  phone: indianPhoneJoi(),
  date_of_birth: Joi.string().isoDate().allow('', null).messages({
    'string.isoDate': 'Enter a valid date (YYYY-MM-DD)',
  }),
  preferred_language: Joi.string().valid('en', 'hi').messages({
    'any.only': 'Language must be en or hi',
  }),
  profile_photo_url: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Enter a valid URL',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one profile field is required',
  })
