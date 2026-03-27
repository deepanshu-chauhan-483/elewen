import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Elewen API',
      version: '1.0.0',
      description:
        'REST API for the Elewen event management platform. Handles authentication, vendor registration, planner leads, and consultation enquiries.',
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
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
