import Joi from 'joi'

export const addItemSchema = Joi.object({
  packageId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().min(1))
    .required()
    .messages({
      'any.required': 'packageId is required',
    }),
  quantity: Joi.number().integer().min(1).default(1),
  selectedOptions: Joi.object().allow(null).optional(),
  addonTitle: Joi.string().allow('', null).optional(),
  addon: Joi.object().allow(null).optional(),
})

export const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'quantity must be at least 1',
    'any.required': 'quantity is required',
  }),
})

export const updateCartSchema = Joi.object({
  eventDate: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': 'Enter a valid date (YYYY-MM-DD)',
  }),
  eventCity: Joi.string().max(100).allow('', null).optional(),
  guestCount: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().allow('', null))
    .optional(),
  itemId: Joi.string().allow(null).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  selectedOptions: Joi.object().allow(null).optional(),
})

export const applyCouponSchema = Joi.object({
  code: Joi.string().min(1).max(50).required().messages({
    'any.required': 'Coupon code is required',
  }),
})
