import Joi from 'joi'

export const createOrderSchema = Joi.object({
  bookingId: Joi.string().required().messages({
    'any.required': 'bookingId is required',
  }),
  paymentType: Joi.string().valid('advance', 'remaining', 'full').required().messages({
    'any.only': 'paymentType must be advance, remaining, or full',
    'any.required': 'paymentType is required',
  }),
})

export const verifyPaymentSchema = Joi.object({
  paymentId: Joi.string().required().messages({
    'any.required': 'paymentId is required',
  }),
  razorpayOrderId: Joi.string().required().messages({
    'any.required': 'razorpayOrderId is required',
  }),
  razorpayPaymentId: Joi.string().allow('', null).optional(),
  razorpaySignature: Joi.string().allow('', null).optional(),
  paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'offline').allow(null).optional(),
  testBypass: Joi.boolean().optional(),
})

export const requestRefundSchema = Joi.object({
  paymentId: Joi.string().required().messages({
    'any.required': 'paymentId is required',
  }),
  reason: Joi.string().max(500).allow('', null).optional(),
})

export const processRefundSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required().messages({
    'any.only': 'action must be approve or reject',
    'any.required': 'action is required',
  }),
})

export const createVendorPayoutSchema = Joi.object({
  vendorId: Joi.string().required().messages({
    'any.required': 'vendorId is required',
  }),
  bookingId: Joi.string().required().messages({
    'any.required': 'bookingId is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'amount must be a positive number',
    'any.required': 'amount is required',
  }),
  paymentMethod: Joi.string().valid('portal', 'offline').optional(),
})

export const updateVendorPayoutSchema = Joi.object({
  status: Joi.string().valid('paid', 'failed').required().messages({
    'any.only': 'status must be paid or failed',
    'any.required': 'status is required',
  }),
  referenceId: Joi.string().max(200).allow('', null).optional(),
})
