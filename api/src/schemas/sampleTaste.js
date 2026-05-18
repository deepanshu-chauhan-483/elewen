import Joi from 'joi'

export const createSampleTasteSchema = Joi.object({
  packageId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().min(1))
    .allow(null)
    .optional(),
  eventId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().min(1))
    .allow(null)
    .optional(),
  guestCount: Joi.number().integer().min(1).allow(null).optional(),
  bookingDate: Joi.string().isoDate().allow('', null).optional().messages({
    'string.isoDate': 'Enter a valid date (YYYY-MM-DD)',
  }),
})

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('assigned', 'delivered', 'completed', 'cancelled')
    .required()
    .messages({
      'any.only': 'status must be one of: assigned, delivered, completed, cancelled',
      'any.required': 'status is required',
    }),
  vendorId: Joi.string().allow('', null).optional(),
  menuItems: Joi.object().allow(null).optional(),
})

export const recordDecisionSchema = Joi.object({
  decision: Joi.string().valid('convert_full', 'save', 'cancel', 'expired').required().messages({
    'any.only': 'decision must be one of: convert_full, save, cancel, expired',
    'any.required': 'decision is required',
  }),
  decisionNotes: Joi.string().max(1000).allow('', null).optional(),
  vendorId: Joi.string().allow('', null).optional(),
  rating: Joi.number().integer().min(1).max(5).allow(null).optional().messages({
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
  }),
  feedbackText: Joi.string().max(1000).allow('', null).optional(),
  vendorRatings: Joi.array()
    .items(
      Joi.object({
        vendorId: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(5).allow(null).optional(),
      })
    )
    .optional(),
})
