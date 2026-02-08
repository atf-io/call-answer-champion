import { CrmProvider, CrmType } from './types';

// Quick lookup map for CRM configs
export const CRM_CONFIGS: Record<CrmType, { name: string; color: string }> = {
  jobber: { name: 'Jobber', color: '#00B289' },
  servicetitan: { name: 'ServiceTitan', color: '#FF6B35' },
  housecall_pro: { name: 'Housecall Pro', color: '#0066FF' },
};

export const CRM_PROVIDERS: CrmProvider[] = [
  {
    id: 'jobber',
    name: 'Jobber',
    description: 'Field service management software for home service businesses',
    logo: '/crm/jobber-logo.svg',
    color: '#00B289',
    features: [
      'Sync SMS & call communications',
      'Customer notes integration',
      'Job scheduling & dispatch',
      'Webhook event triggers'
    ],
    docsUrl: 'https://developer.getjobber.com/docs'
  },
  {
    id: 'servicetitan',
    name: 'ServiceTitan',
    description: 'The #1 software for residential and commercial contractors',
    logo: '/crm/servicetitan-logo.svg',
    color: '#FF6B35',
    features: [
      'Customer communication log',
      'Booking & dispatch integration',
      'Business unit mapping',
      'Real-time availability'
    ],
    docsUrl: 'https://developer.servicetitan.io/'
  },
  {
    id: 'housecall_pro',
    name: 'Housecall Pro',
    description: 'All-in-one business solution for home service professionals',
    logo: '/crm/housecallpro-logo.svg',
    color: '#0066FF',
    features: [
      'Customer note sync',
      'Job creation & scheduling',
      'Automated campaign triggers',
      'Estimate & invoice sync'
    ],
    docsUrl: 'https://developer.housecallpro.com/'
  }
];

export const CRM_WEBHOOK_EVENTS = {
  jobber: [
    { event: 'CLIENT_CREATE', description: 'When a new customer is created' },
    { event: 'CLIENT_UPDATE', description: 'When customer info is updated' },
    { event: 'JOB_CREATE', description: 'When a new job is created' },
    { event: 'JOB_COMPLETE', description: 'When a job is marked complete' }
  ],
  servicetitan: [
    { event: 'customer.created', description: 'When a new customer is created' },
    { event: 'customer.updated', description: 'When customer info is updated' },
    { event: 'job.scheduled', description: 'When a job is scheduled' },
    { event: 'job.completed', description: 'When a job is completed' }
  ],
  housecall_pro: [
    { event: 'customer.created', description: 'When a new customer is created' },
    { event: 'customer.updated', description: 'When customer info is updated' },
    { event: 'job.created', description: 'When a new job is created' },
    { event: 'job.completed', description: 'When a job is completed' }
  ]
};

export const SYNC_TYPE_LABELS = {
  communication: 'Communication',
  contact: 'Contact',
  appointment: 'Appointment'
};

export const SYNC_STATUS_COLORS = {
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
};
