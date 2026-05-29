export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CentraCRM Comprehensive API Documentation',
    version: '1.0.0',
    description: 'Complete, exhaustive documentation of all API routes inside the CentraCRM multi-tenant backend services. Includes Authentication, Leads, Counseling, Finance, Superadmin, LMS, Marketing, Notifications, Programs, and Webhook integrations.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'CentraCRM API Gateway v1'
    }
  ],
  security: [
    {
      BearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Authorize with your JWT token retrieved from the `/auth/login` endpoint.'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation failed or access restricted.' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr_abc123' },
          name: { type: 'string', example: 'Aravind Terli' },
          email: { type: 'string', example: 'admin@organization.com' },
          role: { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'STANDARDUSER'], example: 'ADMIN' },
          tenantId: { type: 'string', example: 'ten_9a8df7' },
          sector: { type: 'string', example: 'EDUCATION' }
        }
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ld_7ea392' },
          name: { type: 'string', example: 'Alex Smith' },
          email: { type: 'string', example: 'alex@domain.com' },
          phone: { type: 'string', example: '+1234567890' },
          stage: { type: 'string', example: 'Leads' },
          source: { type: 'string', example: 'Meta Ads' },
          assignedToId: { type: 'string', example: 'usr_abc123' }
        }
      }
    }
  },
  paths: {
    // ─── AUTHENTICATION & PROFILE ───────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['1. Authentication & Profile'],
        summary: 'User Login / Token Generation',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@centra.com' },
                  password: { type: 'string', example: 'Pass123!' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Successful authentication' } }
      }
    },
    '/auth/register': {
      post: {
        tags: ['1. Authentication & Profile'],
        summary: 'Register New Organization User (Admin/Superadmin only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: { 201: { description: 'User created' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['1. Authentication & Profile'],
        summary: 'Retrieve Active Session Details',
        responses: { 200: { description: 'Returns authenticated user details' } }
      }
    },
    '/auth/profile': {
      patch: {
        tags: ['1. Authentication & Profile'],
        summary: 'Update User Profile Settings (Theme / Accent)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: { 200: { description: 'Profile updated' } }
      }
    },
    '/auth/tenant/branding': {
      get: {
        tags: ['1. Authentication & Profile'],
        summary: 'Get Tenant Branding Details for Session',
        responses: { 200: { description: 'Returns tenant name and logo' } }
      }
    },
    '/auth/users': {
      get: {
        tags: ['1. Authentication & Profile'],
        summary: 'List All Tenant Organization Users',
        responses: { 200: { description: 'User list' } }
      }
    },
    '/auth/roles': {
      get: { tags: ['1. Authentication & Profile'], summary: 'List Custom Roles' },
      post: { tags: ['1. Authentication & Profile'], summary: 'Create New Custom Role' }
    },
    '/auth/roles/{id}': {
      delete: {
        tags: ['1. Authentication & Profile'],
        summary: 'Delete Custom Role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/auth/roles/{id}/permissions': {
      put: {
        tags: ['1. Authentication & Profile'],
        summary: 'Update Custom Role Module Permissions Matrix',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/auth/invite': {
      post: {
        tags: ['1. Authentication & Profile'],
        summary: 'Send Invitation Email to New Team Member',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/auth/invitations': {
      get: { tags: ['1. Authentication & Profile'], summary: 'Get List of Sent Invitations' }
    },
    '/auth/invitations/{id}/resend': {
      post: {
        tags: ['1. Authentication & Profile'],
        summary: 'Resend Invitation Email Link',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/auth/accept-invite': {
      post: {
        tags: ['1. Authentication & Profile'],
        summary: 'Accept Invitation & Create Password Account',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },

    // ─── LEADS & PIPELINES ──────────────────────────────────────────────────
    '/leads': {
      get: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Query and Search Tenant Leads',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'stage', in: 'query', schema: { type: 'string' } }
        ]
      },
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Create New CRM Lead/Prospect',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/leads/stats': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Retrieve Lead Dashboard Metrics & Funnel Counts' }
    },
    '/leads/form-structure': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Get Form Inputs structure based on Tenant Custom Fields config' }
    },
    '/leads/import': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Import Multiple Leads in Bulk from CSV Payload',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/leads/bulk-whatsapp': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Send WhatsApp Templates to Multiple Selected Leads in Bulk',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/leads/upload-media': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Upload Media (Images/PDFs) for Bulk WhatsApp Broadcast',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object' } } } }
      }
    },
    '/leads/follow-ups/upcoming': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Get Active Upcoming Tasks & Follow-up Meetings' }
    },
    '/leads/follow-ups/{id}': {
      patch: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Update Scheduled Follow-up Details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/follow-ups/{id}/complete': {
      patch: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Mark Follow-up Agenda Item as Completed',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}': {
      get: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Get Detailed Lead Record History',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      },
      patch: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Update Lead Details (Status, Pipeline stage, assignedTo)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      },
      delete: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Permanent Deletion of a Lead Record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}/follow-ups': {
      get: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Get Follow-ups related to a Single Lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}/follow-up': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Schedule a New Follow-up Meeting/Task for a Lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/leads/{id}/notes': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Add Assessor Timeline Remarks or General Note to Lead History',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}/log-interaction': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Log Manual Call / SMS Outbound Interaction History',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}/messages': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Retrieve Message Logs (SMS/WhatsApp) for Lead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      post: { tags: ['2. Leads & Pipelines'], summary: 'Send Outbound Custom Message (WhatsApp/SMS)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/leads/{id}/calls': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Get Twilio Phone Call Log History for Lead', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      post: { tags: ['2. Leads & Pipelines'], summary: 'Initiate Twilio Outbound Call Dialing', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/leads/{id}/send-template': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Send WhatsApp Business Approved Message Template',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/{id}/reactivate': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Reactivate Inactive / Suspended / Rejected Lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/leads/twilio/token': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Get Twilio Voice Token for Browser Dialing integration' }
    },
    '/leads/public': {
      post: {
        tags: ['2. Leads & Pipelines'],
        summary: 'Public Lead Ingestion Endpoint (e.g. self-onboarding forms)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/leads/webhook/google-ads': {
      post: { tags: ['2. Leads & Pipelines'], summary: 'Public Ingestion Endpoint for Google Ads Leads webhook', security: [] }
    },
    '/leads/webhook/meta': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'Verify Facebook Meta Webhook Subscription', security: [] },
      post: { tags: ['2. Leads & Pipelines'], summary: 'Process Incoming Real-Time Meta Lead Gen Form Payload', security: [] }
    },
    '/leads/webhook/meta/sync': {
      post: { tags: ['2. Leads & Pipelines'], summary: 'Manually Sync Meta Lead Ads history for Page/Form', security: [] }
    },
    '/leads/webhook/meta/subscribe': {
      post: { tags: ['2. Leads & Pipelines'], summary: 'Subscribe App webhook to Meta LeadGen page', security: [] }
    },
    '/leads/meta/pages': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'List Authorized Meta Facebook Pages', security: [] }
    },
    '/leads/meta/forms/{pageId}': {
      get: { tags: ['2. Leads & Pipelines'], summary: 'List LeadGen Forms for a Facebook Page', security: [], parameters: [{ name: 'pageId', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/leads/twilio/voice': {
      post: { tags: ['2. Leads & Pipelines'], summary: 'Handle Twilio Voice Calls Webhook TwiML generation', security: [] }
    },
    '/leads/twilio/status': {
      post: { tags: ['2. Leads & Pipelines'], summary: 'Process Outbound Dialing Call Status logs Webhook', security: [] }
    },

    // ─── COUNSELING & SCHEDULES ─────────────────────────────────────────────
    '/counseling/follow-up': {
      post: {
        tags: ['3. Counseling & Schedules'],
        summary: 'Schedule Counselor Consultation / Site Visit for a Student Lead',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/counseling/log': {
      post: {
        tags: ['3. Counseling & Schedules'],
        summary: 'Log Meeting Counseling Interaction Minutes',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/counseling/schedule': {
      get: { tags: ['3. Counseling & Schedules'], summary: 'Get Current Logged-in Counselor Consultation Schedule / Agenda' }
    },
    '/counseling/students': {
      get: { tags: ['3. Counseling & Schedules'], summary: 'Get List of Assigned Student Prospects' }
    },

    // ─── ACADEMIC ENROLLMENTS & APPLICATIONS ────────────────────────────────
    '/applications': {
      get: { tags: ['4. Academic Enrollments & Applications'], summary: 'List Academic Application Portfolios & Admission queues' },
      post: {
        tags: ['4. Academic Enrollments & Applications'],
        summary: 'Log New Academic Application Portfolio for Lead',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/applications/public/{id}': {
      get: { tags: ['4. Academic Enrollments & Applications'], summary: 'Public endpoint to view application and upload pending documents', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/applications/{id}/status': {
      patch: {
        tags: ['4. Academic Enrollments & Applications'],
        summary: 'Update Application status (e.g. APPROVED, REJECTED, SUBMITTED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/applications/{id}/confirm': {
      post: {
        tags: ['4. Academic Enrollments & Applications'],
        summary: 'Confirm Admission & Issue Fee Payment invoices',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/applications/{id}/letter': {
      get: {
        tags: ['4. Academic Enrollments & Applications'],
        summary: 'Download Generated PDF Admission Letter',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/applications/{id}/documents': {
      post: {
        tags: ['4. Academic Enrollments & Applications'],
        summary: 'Assign / Link assesor verification document requests',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },

    // ─── DOCUMENT STORAGE & ALLOCATION ──────────────────────────────────────
    '/documents/public/upload': {
      post: {
        tags: ['5. Document Storage & Allocation'],
        summary: 'Public document upload from onboarding paperwork forms',
        security: [],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object' } } } }
      }
    },
    '/documents/upload': {
      post: {
        tags: ['5. Document Storage & Allocation'],
        summary: 'Assessor Upload Student Document (PDF/Images)',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object' } } } }
      }
    },
    '/documents/application/{applicationId}': {
      get: { tags: ['5. Document Storage & Allocation'], summary: 'List Uploaded Documents for specific Application', parameters: [{ name: 'applicationId', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/documents/{id}/verify': {
      patch: {
        tags: ['5. Document Storage & Allocation'],
        summary: 'Assessor Approve or Reject specific Document Upload',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/documents/all': {
      get: { tags: ['5. Document Storage & Allocation'], summary: 'Central listing of all Documents under Active Organization' }
    },
    '/documents/storage-stats': {
      get: { tags: ['5. Document Storage & Allocation'], summary: 'Get Storage Quota Stats and allocated limit indicators' }
    },
    '/documents/{id}': {
      delete: {
        tags: ['5. Document Storage & Allocation'],
        summary: 'Permanently Delete specific Document physically and in DB',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },

    // ─── BILLINGS & PAYMENTS ────────────────────────────────────────────────
    '/finance/webhook': {
      post: { tags: ['6. Billings & Payments'], summary: 'Public unauthenticated Razorpay Webhook for Payment confirmations', security: [] }
    },
    '/finance/fees': {
      get: { tags: ['6. Billings & Payments'], summary: 'Query and Search All Student Fees / Invoices list' }
    },
    '/finance/stats': {
      get: { tags: ['6. Billings & Payments'], summary: 'Retrieve Revenue Collection charts and collections KPIs' }
    },
    '/finance/fees/{id}/sync': {
      get: { tags: ['6. Billings & Payments'], summary: 'Sync status of a transaction directly with Razorpay gateway API', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/finance/fees/{id}/link': {
      get: { tags: ['6. Billings & Payments'], summary: 'Get active Razorpay payment link for an invoice', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      post: { tags: ['6. Billings & Payments'], summary: 'Generate new Razorpay payment link dynamically', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/finance/payments': {
      post: {
        tags: ['6. Billings & Payments'],
        summary: 'Record Cash / Bank Transfer Offline Manual Payment Receipt',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },

    // ─── MARKETING & CAMPAIGNS ──────────────────────────────────────────────
    '/marketing': {
      get: { tags: ['7. Marketing & Campaigns'], summary: 'List Active Omnichannel Marketing Campaigns & Budgets' },
      post: { tags: ['7. Marketing & Campaigns'], summary: 'Create New Multi-Channel Campaign definition', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/marketing/{id}/execute': {
      post: {
        tags: ['7. Marketing & Campaigns'],
        summary: 'Execute Active Campaign dispatch (Email/WhatsApp/SMS broadcasts)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
      }
    },
    '/marketing/{id}/analytics': {
      get: { tags: ['7. Marketing & Campaigns'], summary: 'Get ROI, Delivery Reports, and conversion analytics for Campaign', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/campaigns': {
      post: { tags: ['7. Marketing & Campaigns'], summary: 'Legacy Create Campaign schema route support' }
    },
    '/campaigns/broadcast': {
      post: { tags: ['7. Marketing & Campaigns'], summary: 'Send Bulk Broadcast messages to uploaded CSV targets list' }
    },
    '/campaigns/broadcasts/history': {
      get: { tags: ['7. Marketing & Campaigns'], summary: 'Get Complete History list of Bulk Outbound Campaigns' }
    },

    // ─── WEBINARS ───────────────────────────────────────────────────────────
    '/webinars': {
      get: { tags: ['8. Webinars & Seminars'], summary: 'Query and List Scheduled Webinars & Seminars' },
      post: { tags: ['8. Webinars & Seminars'], summary: 'Schedule a New Interactive Webinar', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/webinars/{id}': {
      put: { tags: ['8. Webinars & Seminars'], summary: 'Modify Webinar scheduled timings/details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      delete: { tags: ['8. Webinars & Seminars'], summary: 'Cancel / Delete Webinar event', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/webinars/{id}/register': {
      post: { tags: ['8. Webinars & Seminars'], summary: 'Manually register a prospect lead to Webinar', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/webinars/{id}/public': {
      get: { tags: ['8. Webinars & Seminars'], summary: 'Public landing page view details for scheduled Webinar', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/webinars/{id}/register-public': {
      post: { tags: ['8. Webinars & Seminars'], summary: 'Public Lead self-registration to Webinar event', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },

    // ─── DYNAMIC SCHEDULING & AUTOMATIONS ───────────────────────────────────
    '/notification-rules': {
      get: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'List Active Multi-Tenant Automation & Notification Rules' },
      post: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Create New Trigger Rule (e.g. Lead Created ➔ Send SMS)', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/notification-rules/queue': {
      get: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Get List of Pending Trigger events in Queued queue' }
    },
    '/notification-rules/queue/{id}': {
      delete: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Cancel/Wipe a pending queued notification item', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/notification-rules/queue/{id}/retry': {
      post: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Manually retry a failed queued trigger dispatch', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/notification-rules/schedule': {
      post: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Manually Schedule a Custom One-Shot target notification rule' }
    },
    '/notification-rules/{id}': {
      put: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Update Rule Trigger details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      delete: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Permanently Delete an Automation Rule', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/notification-rules/{id}/toggle': {
      patch: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Toggle Rule Active/Disabled status state', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/notifications': {
      get: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Retrieve Logged-In User System In-App Logs Feed' }
    },
    '/notifications/mark-all-read': {
      put: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Mark all User notifications as Read' }
    },
    '/notifications/{id}/read': {
      put: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Mark Specific notification as Read', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/notifications/clear-all': {
      delete: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Clear all Notifications history for User' }
    },
    '/notifications/{id}': {
      delete: { tags: ['9. Dynamic Scheduling & Automations'], summary: 'Wipe Specific Notification log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },

    // ─── ACADEMIC OFFERS & SERVICES ─────────────────────────────────────────
    '/programs/public': {
      get: { tags: ['10. Academic Offers & Services'], summary: 'Get List of Programs publicly for public forms dropdowns', security: [] }
    },
    '/programs': {
      get: { tags: ['10. Academic Offers & Services'], summary: 'Query and Search Academic Course offerings / Project properties lists' },
      post: { tags: ['10. Academic Offers & Services'], summary: 'Create New Program / Property offering (Admin only)', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/programs/{id}': {
      patch: { tags: ['10. Academic Offers & Services'], summary: 'Modify Course/Property details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },

    // ─── ANALYTICS & SYSTEM REPORTS ─────────────────────────────────────────
    '/reports/leads': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Lead Source, Acquisition and Conversion reports analytics' }
    },
    '/reports/assignedTos': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Counselor / Team member conversions stats' }
    },
    '/reports/funnel': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Total Multi-Stage Pipeline conversion funnel analysis' }
    },
    '/reports/programs': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Program / Property performance and interest rankings' }
    },
    '/reports/finance': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Revenue billing collections and target reports charts' }
    },
    '/reports/activities': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Timeline Feed of recent user and system events' }
    },
    '/reports/monthly': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Get Compiled Monthly Operations Analytics summary metrics' }
    },
    '/reports/monthly/pdf': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Download Monthly Executive PDF Report document' }
    },
    '/reports/payments/{id}/receipt': {
      get: { tags: ['11. Analytics & System Reports'], summary: 'Download PDF Fee Payment Receipt document', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },

    // ─── MULTITENANT CUSTOMIZATIONS ──────────────────────────────────────────
    '/tenant/config': {
      get: { tags: ['12. Multitenant Customizations'], summary: 'Get Tenant Active configurations (branding, dynamic custom fields, sector layout structures)' },
      put: { tags: ['12. Multitenant Customizations'], summary: 'Update Tenant Configurations & branding custom fields builder templates', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/tenant/connector-definitions': {
      get: { tags: ['12. Multitenant Customizations'], summary: 'Get List of Enabled and Installed Connectors definitions' }
    },
    '/tenant/connectors/test': {
      post: { tags: ['12. Multitenant Customizations'], summary: 'Test a connector integration hook parameters live' }
    },

    // ─── EXTERNAL INTEGRATIONS & WEBHOOKS ───────────────────────────────────
    '/lms/external': {
      post: {
        tags: ['13. External Integrations & Webhooks'],
        summary: 'Capture incoming Lead registration data from External LMS platforms',
        security: [],
        parameters: [{ name: 'x-api-key', in: 'header', required: true, schema: { type: 'string' }, description: 'LMS secret integration key' }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
      }
    },
    '/whatsapp/webhook': {
      get: { tags: ['13. External Integrations & Webhooks'], summary: 'Meta Whatsapp Cloud API Verification challenge endpoint', security: [] },
      post: { tags: ['13. External Integrations & Webhooks'], summary: 'Process incoming real-time WhatsApp incoming replies webhooks', security: [] }
    },

    // ─── SUPERADMIN PLATFORM COMMANDS ───────────────────────────────────────
    '/superadmin/tenants/{id}': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Get Tenant Detail and License metrics', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },
    '/superadmin/stats': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Get Platform System Core global stats (Total tenants, active licenses, usage metrics)' }
    },
    '/superadmin/leads': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Superadmin View All Leads across all multi-tenant nodes' }
    },
    '/superadmin/billing': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Superadmin Billing invoices revenue summary stats' }
    },
    '/superadmin/forms': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Get Platform global base forms schemas' },
      post: { tags: ['14. Superadmin Platform Commands'], summary: 'Create new standard global form schema definitions template' }
    },
    '/superadmin/analytics': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Superadmin core system performance logs and analytics charts' }
    },
    '/superadmin/connectors': {
      get: { tags: ['14. Superadmin Platform Commands'], summary: 'Get list of globally defined Connectors' },
      post: { tags: ['14. Superadmin Platform Commands'], summary: 'Create a new Connector integration profile definition' }
    },
    '/superadmin/connectors/{id}': {
      put: { tags: ['14. Superadmin Platform Commands'], summary: 'Update connector definition profile', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      delete: { tags: ['14. Superadmin Platform Commands'], summary: 'Wipe / Delete connector definition profile', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    },

    // ─── TEMPLATES MANAGEMENT ───────────────────────────────────────────────
    '/templates': {
      get: { tags: ['15. Templates Management'], summary: 'List all custom message templates (SMS/WhatsApp)' },
      post: { tags: ['15. Templates Management'], summary: 'Create new message template definition', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
    },
    '/templates/{id}': {
      put: { tags: ['15. Templates Management'], summary: 'Modify template content', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] },
      delete: { tags: ['15. Templates Management'], summary: 'Delete message template', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
    }
  }
};
