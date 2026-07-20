import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Elewen API',
      version: '1.0.0',
      description:
        'REST API for the Elewen event management platform. Handles authentication, cart, bookings, vendor registration, planner leads, and consultation enquiries.\n\n**Note on IDs:** Strapi entity IDs (packageId, couponId, vendorId, etc.) are numeric integers from the Strapi database (e.g. `4`). These are stored as strings internally but always passed as integers from the frontend.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Strapi-compatible JWT. Obtain from /auth/login or /auth/register.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            first_name: { type: 'string', example: 'Priya' },
            last_name: { type: 'string', example: 'Sharma' },
            phone: { type: 'string', example: '9876543210' },
            confirmed: { type: 'boolean', example: true },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            jwt: { type: 'string', description: 'Short-lived Strapi JWT (7 days)' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Something went wrong' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Required fields missing' },
            fields: {
              type: 'object',
              additionalProperties: { type: 'string' },
              example: { email: 'Required', phone: 'Required' },
            },
          },
        },
        CustomerProfile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            documentId: { type: 'string' },
            first_name: { type: 'string', nullable: true },
            last_name: { type: 'string', nullable: true },
            date_of_birth: { type: 'string', format: 'date', nullable: true },
            preferred_language: { type: 'string', example: 'en' },
            photoUrl: {
              type: 'string',
              nullable: true,
              description:
                'Resolved photo URL: uploaded photo > Google CDN URL > null (frontend shows placeholder)',
            },
            hasUploadedPhoto: {
              type: 'boolean',
              description: 'True if user has uploaded a photo via Strapi media',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cartId: { type: 'string', format: 'uuid' },
            packageId: {
              type: 'string',
              description: 'Strapi numeric package ID stored as string',
            },
            title: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'string', example: '28000.00' },
            totalPrice: { type: 'string', example: '28000.00' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', description: 'Strapi user ID stored as string' },
            eventDate: { type: 'string', format: 'date', nullable: true },
            eventCity: { type: 'string', nullable: true },
            guestCount: { type: 'integer', nullable: true },
            couponId: { type: 'string', nullable: true },
            subtotal: { type: 'string', example: '28000.00' },
            discountAmount: { type: 'string', example: '0.00' },
            total: { type: 'string', example: '28000.00' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          },
        },
        SampleTaste: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            packageId: { type: 'string', nullable: true },
            eventId: { type: 'string', nullable: true },
            bookingId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Set when converted to full booking',
            },
            guestCount: { type: 'integer', nullable: true },
            bookingDate: { type: 'string', format: 'date', nullable: true },
            deliveryDate: { type: 'string', format: 'date', nullable: true },
            status: {
              type: 'string',
              enum: ['new', 'assigned', 'delivered', 'completed', 'cancelled'],
            },
            decision: {
              type: 'string',
              enum: ['convert_full', 'save', 'cancel', 'expired'],
              nullable: true,
            },
            decisionNotes: { type: 'string', nullable: true },
            feedbackSubmitted: { type: 'boolean' },
            expiryDate: { type: 'string', format: 'date', nullable: true },
            vendors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  vendorId: { type: 'string' },
                  menuItems: { type: 'object', nullable: true },
                  rating: { type: 'integer', nullable: true },
                  feedbackText: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            packageId: { type: 'string' },
            eventDate: { type: 'string', format: 'date' },
            eventTime: { type: 'string', nullable: true, example: '18:30' },
            guestCount: { type: 'integer' },
            status: {
              type: 'string',
              enum: [
                'new',
                'confirmed',
                'info_collection',
                'planning',
                'pre_event',
                'execution',
                'post_event',
                'completed',
                'cancelled',
              ],
            },
            totalPrice: { type: 'string', example: '28000.00' },
            advanceAmount: { type: 'string', example: '8400.00' },
            remainingAmount: { type: 'string', example: '19600.00' },
            discountAmount: { type: 'string', example: '0.00' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BookingNote: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            adminId: {
              type: 'string',
              description: 'ID of the author (customer or admin)',
            },
            note: { type: 'string' },
            isInternal: {
              type: 'boolean',
              description: 'Internal admin-only notes not returned to customer',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BookingFile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            fileUrl: {
              type: 'string',
              example: 'https://res.cloudinary.com/elewen/image/upload/...',
            },
            fileType: {
              type: 'string',
              enum: ['document', 'contract', 'image'],
              nullable: true,
            },
            uploadedBy: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            paymentType: { type: 'string', enum: ['advance', 'remaining', 'full'] },
            amount: { type: 'string', example: '19600.00' },
            status: { type: 'string', enum: ['pending', 'success', 'failed', 'refunded'] },
            provider: { type: 'string', enum: ['cashfree', 'razorpay', 'stripe', 'manual'], nullable: true },
            providerOrderId: { type: 'string', nullable: true, example: 'order_SYwBHt...' },
            providerPaymentId: { type: 'string', nullable: true, example: 'pay_SYwBHt...' },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'upi', 'netbanking', 'offline'],
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Refund: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            paymentId: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid', nullable: true },
            amount: { type: 'string', example: '19600.00' },
            reason: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['requested', 'processing', 'completed', 'rejected'] },
            gatewayRefundId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        VendorPayout: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            vendorId: { type: 'string' },
            bookingId: { type: 'string', format: 'uuid' },
            amount: { type: 'string', example: '15000.00' },
            status: { type: 'string', enum: ['pending', 'paid', 'failed'] },
            paymentMethod: { type: 'string', enum: ['portal', 'offline'], nullable: true },
            referenceId: { type: 'string', nullable: true },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        VendorAssignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            vendorId: { type: 'string', description: 'Strapi vendor ID' },
            serviceId: {
              type: 'string',
              nullable: true,
              description: 'Strapi service category ID',
            },
            assignedBy: { type: 'string', nullable: true, description: 'Admin user ID' },
            status: { type: 'string', enum: ['assigned', 'confirmed', 'completed', 'reassigned'] },
            assignedAt: { type: 'string', format: 'date-time' },
          },
        },
        VendorBankInfo: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            vendorId: { type: 'string' },
            bankName: { type: 'string', nullable: true },
            accountNumber: { type: 'string', nullable: true },
            ifscCode: { type: 'string', nullable: true },
            accountHolderName: { type: 'string', nullable: true },
            paymentPreference: { type: 'string', enum: ['portal', 'offline'], nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            threadId: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', description: 'Strapi user ID' },
            messageText: { type: 'string', nullable: true },
            messageType: { type: 'string', enum: ['text', 'system', 'status_update'] },
            createdAt: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  fileUrl: { type: 'string' },
                  fileType: {
                    type: 'string',
                    enum: ['image', 'document', 'media'],
                    nullable: true,
                  },
                },
              },
            },
            readStatus: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  readAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        MessageThread: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid' },
            createdBy: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
          },
        },
        SupportTicket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            bookingId: { type: 'string', format: 'uuid', nullable: true },
            subject: { type: 'string' },
            status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  senderId: { type: 'string' },
                  message: { type: 'string' },
                  isInternalNote: { type: 'boolean' },
                  attachmentUrl: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
