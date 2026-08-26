export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Diesel System API',
    version: '1.0.0',
    description: 'Backend for the Diesel System mobile application (fuel tracking).',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          refreshTokenExpiresAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              place: { type: 'string' },
              name: { type: 'string', nullable: true },
            },
          },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'integer' },
          vehicle_number: { type: 'string' },
          vehicle_name: { type: 'string' },
          vehicle_type: { type: 'string' },
          vehicle_class: { type: 'string' },
          owner_name: { type: 'string', nullable: true },
          department: { type: 'string', nullable: true },
          organization: { type: 'string', nullable: true },
          place: { type: 'string', nullable: true },
          current_meter_reading: { type: 'number' },
          permitted_liters: { type: 'number' },
        },
      },
      FuelLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          vehicle_id_fk: { type: 'integer' },
          meter_reading: { type: 'number' },
          previous_meter_reading: { type: 'number' },
          calculated_distance: { type: 'number' },
          filled_liters: { type: 'number' },
          calculated_efficiency: { type: 'number', nullable: true },
          transaction_date: { type: 'string', example: '2026-08-23' },
          transaction_time: { type: 'string', example: '10:30:00' },
          transaction_timestamp: { type: 'string', example: '2026-08-23T10:30:00' },
          place: { type: 'string' },
          vehicle_number: { type: 'string' },
        },
      },
      MonthlyReport: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          month_name: { type: 'string' },
          total_diesel: { type: 'number' },
          total_fills: { type: 'integer' },
          first_date: { type: 'string' },
          last_date: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: {
            description: 'Token pair + user profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: { description: 'Rate limited', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token (issues new token pair)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'New token pair', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { description: 'Invalid/revoked/expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke a refresh token',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: { 204: { description: 'Revoked' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/users/me': {
      get: {
        summary: 'Current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/vehicles': {
      get: {
        summary: 'List vehicles (optionally filtered by place)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'place', in: 'query', schema: { type: 'string' }, required: false },
        ],
        responses: {
          200: {
            description: 'Vehicle list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a vehicle',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          409: { description: 'Duplicate vehicle number', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/vehicles/{number}': {
      get: {
        summary: 'Get a vehicle by number (via vehicle_info view)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'number', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Vehicle', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          404: { description: 'Not found' },
        },
      },
      patch: {
        summary: 'Partially update a vehicle by number',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'number', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated vehicle' }, 404: { description: 'Not found' } },
      },
    },
    '/fuel-logs/recent': {
      get: {
        summary: 'Recent fuel logs for a place, newest first',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'place', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: { 200: { description: 'Flattened log list including vehicle number' } },
      },
    },
    '/fuel-logs/last': {
      get: {
        summary: "Last log of a vehicle (via fuel_logs_with_vehicle view)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehicleNumber', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Log or null' } },
      },
    },
    '/fuel-logs': {
      get: {
        summary: 'Logs in [from, to) date range',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', required: true, schema: { type: 'string', example: '2026-08-01' } },
          { name: 'to', in: 'query', required: true, schema: { type: 'string', example: '2026-09-01' } },
        ],
        responses: { 200: { description: 'Log list' } },
      },
      post: {
        summary:
          'Record a fuel fill — distance/efficiency derived server-side; advances the vehicle meter atomically',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicle_number', 'meter_reading', 'filled_liters', 'place', 'transaction_date', 'transaction_time'],
                properties: {
                  vehicle_number: { type: 'string' },
                  meter_reading: { type: 'number' },
                  filled_liters: { type: 'number' },
                  place: { type: 'string' },
                  transaction_date: { type: 'string', example: '2026-08-23' },
                  transaction_time: { type: 'string', example: '09:45' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created log', content: { 'application/json': { schema: { $ref: '#/components/schemas/FuelLog' } } } },
          422: { description: 'Unknown vehicle or non-increasing meter', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/reports/monthly': {
      get: {
        summary: 'List monthly reports',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Report list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/MonthlyReport' } },
              },
            },
          },
        },
      },
    },
    '/reports/monthly/{monthName}': {
      get: {
        summary: 'Monthly report by name',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'monthName', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Report', content: { 'application/json': { schema: { $ref: '#/components/schemas/MonthlyReport' } } } },
          404: { description: 'Not found' },
        },
      },
    },
    '/reports/monthly/refresh': {
      post: {
        summary: 'Aggregate fuel_logs over [firstDatePrev, lastDatePrev) and upsert the monthly report',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstDatePrev', 'lastDatePrev', 'period'],
                properties: {
                  firstDatePrev: { type: 'string', example: '2026-07-01' },
                  lastDatePrev: { type: 'string', example: '2026-08-01' },
                  period: { type: 'string', example: 'July' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Upserted report', content: { 'application/json': { schema: { $ref: '#/components/schemas/MonthlyReport' } } } } },
      },
    },
    '/reports/yearly': {
      get: {
        summary: 'List yearly reports',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Report list' } },
      },
    },
  },
};
