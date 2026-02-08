/**
 * Centralized template variable definitions for SMS campaigns and agent prompts.
 * These variables are populated from inbound webhook payloads (lead-webhook, sms-inbound).
 */

export interface TemplateVariable {
  label: string;
  value: string;
  description: string;
  source: 'lead' | 'business' | 'conversation' | 'system';
}

export interface VariableGroup {
  label: string;
  description?: string;
  variables: TemplateVariable[];
}

/**
 * All available template variables organized by category.
 * These match the data available from webhook payloads and business profile.
 */
export const templateVariableGroups: VariableGroup[] = [
  {
    label: "Lead Information",
    description: "Data from incoming lead webhooks",
    variables: [
      { label: "First Name", value: "{{first_name}}", description: "Lead's first name (parsed from full name)", source: 'lead' },
      { label: "Last Name", value: "{{last_name}}", description: "Lead's last name (parsed from full name)", source: 'lead' },
      { label: "Full Name", value: "{{full_name}}", description: "Lead's complete name", source: 'lead' },
      { label: "Phone", value: "{{phone}}", description: "Lead's phone number", source: 'lead' },
      { label: "Email", value: "{{email}}", description: "Lead's email address", source: 'lead' },
      { label: "Lead Source", value: "{{lead_source}}", description: "Where the lead came from (e.g., angi, thumbtack)", source: 'lead' },
    ],
  },
  {
    label: "Service Details",
    description: "Service request information from the lead",
    variables: [
      { label: "Service Category", value: "{{service_category}}", description: "Type of service requested", source: 'lead' },
      { label: "Service Description", value: "{{service_description}}", description: "Detailed service request notes", source: 'lead' },
      { label: "Task Name", value: "{{task_name}}", description: "Specific task or job name", source: 'lead' },
      { label: "Comments", value: "{{comments}}", description: "Additional notes from the lead", source: 'lead' },
    ],
  },
  {
    label: "Location",
    description: "Address and location data",
    variables: [
      { label: "Address", value: "{{address}}", description: "Lead's full address", source: 'lead' },
      { label: "City", value: "{{city}}", description: "Lead's city", source: 'lead' },
      { label: "State", value: "{{state}}", description: "Lead's state", source: 'lead' },
      { label: "Postal Code", value: "{{postal_code}}", description: "Lead's ZIP/postal code", source: 'lead' },
    ],
  },
  {
    label: "Business",
    description: "Your business profile data",
    variables: [
      { label: "Business Name", value: "{{business_name}}", description: "Your company name", source: 'business' },
      { label: "Business Phone", value: "{{business_phone}}", description: "Your business phone number", source: 'business' },
      { label: "Business Email", value: "{{business_email}}", description: "Your business email address", source: 'business' },
      { label: "Business Address", value: "{{business_address}}", description: "Your business location", source: 'business' },
      { label: "Agent Name", value: "{{agent_name}}", description: "Name of the AI agent", source: 'system' },
    ],
  },
  {
    label: "Conversation",
    description: "Current conversation context",
    variables: [
      { label: "Conversation ID", value: "{{conversation_id}}", description: "Unique conversation identifier", source: 'conversation' },
      { label: "Message Count", value: "{{message_count}}", description: "Number of messages exchanged", source: 'conversation' },
      { label: "Conversation Status", value: "{{conversation_status}}", description: "Current status (active, ended, escalated)", source: 'conversation' },
    ],
  },
  {
    label: "Date & Time",
    description: "Current date and time values",
    variables: [
      { label: "Current Date", value: "{{current_date}}", description: "Today's date (formatted)", source: 'system' },
      { label: "Current Time", value: "{{current_time}}", description: "Current time (formatted)", source: 'system' },
      { label: "Day of Week", value: "{{day_of_week}}", description: "Current day name", source: 'system' },
    ],
  },
];

/**
 * Flat list of all variables for quick lookup
 */
export const allTemplateVariables: TemplateVariable[] = templateVariableGroups.flatMap(g => g.variables);

/**
 * Get variable by its template value (e.g., "{{first_name}}")
 */
export function getVariableByValue(value: string): TemplateVariable | undefined {
  return allTemplateVariables.find(v => v.value === value);
}

/**
 * Extract variable names from a template string
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

/**
 * Render a template string with variable values
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

/**
 * Build template variables from lead webhook payload and business profile
 */
export function buildTemplateVariables(
  lead: {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
    service?: string;
    address?: string;
    notes?: string;
  },
  business?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  },
  agent?: {
    name?: string;
  },
  conversation?: {
    id?: string;
    messageCount?: number;
    status?: string;
  }
): Record<string, string> {
  const nameParts = (lead.name || '').trim().split(' ');
  const firstName = nameParts[0] || 'there';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    // Lead info
    first_name: firstName,
    last_name: lastName,
    full_name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    lead_source: lead.source || '',
    
    // Service details
    service_category: lead.service || '',
    service_description: lead.notes || '',
    task_name: lead.service || '',
    comments: lead.notes || '',
    
    // Location (would need parsing from address in real implementation)
    address: lead.address || '',
    city: '', // Would parse from address
    state: '', // Would parse from address
    postal_code: '', // Would parse from address
    
    // Business
    business_name: business?.name || 'Our Team',
    business_phone: business?.phone || '',
    business_email: business?.email || '',
    business_address: business?.address || '',
    agent_name: agent?.name || 'AI Assistant',
    
    // Conversation
    conversation_id: conversation?.id || '',
    message_count: String(conversation?.messageCount || 0),
    conversation_status: conversation?.status || '',
    
    // Date & Time
    current_date: now.toLocaleDateString(),
    current_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day_of_week: days[now.getDay()],
  };
}
