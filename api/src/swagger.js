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
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cartId: { type: 'string', format: 'uuid' },
            packageId: { type: 'string', description: 'Strapi numeric package ID stored as string' },
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
            items: { type: 'array', items: { '$ref': '#/components/schemas/CartItem' } },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            packageId: { type: 'string' },
            eventDate: { type: 'string', format: 'date' },
            guestCount: { type: 'integer' },
            status: { type: 'string', enum: ['new', 'confirmed', 'info_collection', 'planning', 'pre_event', 'execution', 'post_event', 'completed', 'cancelled'] },
            totalPrice: { type: 'string', example: '28000.00' },
            advanceAmount: { type: 'string', example: '8400.00' },
            remainingAmount: { type: 'string', example: '19600.00' },
            discountAmount: { type: 'string', example: '0.00' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
