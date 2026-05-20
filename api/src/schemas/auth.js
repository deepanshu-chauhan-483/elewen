import Joi from 'joi'

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
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian phone number',
      'any.required': 'Phone number is required',
    }),
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
  first_name: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters',
  }),
  last_name: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters',
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian phone number',
    }),
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
