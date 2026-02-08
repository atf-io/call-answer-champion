import type { AgentSchedulingConfig } from "@/lib/crm/types";

/**
 * Builds scheduling context to inject into agent prompts
 * so the AI understands which services it can schedule
 */
export function buildSchedulingContext(config: AgentSchedulingConfig | undefined | null): string {
  if (!config?.enabled || config.allowed_products_or_services.length === 0) {
    return '';
  }
  
  const services = config.allowed_products_or_services
    .map(s => `- ${s.name}`)
    .join('\n');
    
  const technicians = config.allowed_technicians.length > 0
    ? config.allowed_technicians.map(t => t.name).join(', ')
    : 'Any available technician';
  
  let assignmentRule = '';
  switch (config.technician_assignment) {
    case 'any_available':
      assignmentRule = 'Assign to any available technician';
      break;
    case 'round_robin':
      assignmentRule = 'Rotate assignment between available technicians';
      break;
    case 'specific':
      assignmentRule = 'Ask customer which technician they prefer';
      break;
  }
    
  let context = `
## Scheduling Capabilities

You can help customers schedule appointments for these services:
${services}

Available technicians: ${technicians}

When scheduling:
- Offer a ${config.service_window_hours || 4}-hour arrival window
- Assignment rule: ${assignmentRule}`;

  if (config.require_confirmation && config.confirmation_message) {
    context += `\n- After booking, confirm with: "${config.confirmation_message}"`;
  }

  context += `

## Function Calling

When the customer confirms they want to book an appointment, you MUST use the book_appointment function by including this exact format in your response:

[FUNCTION:book_appointment]
{
  "service_name": "the service they requested",
  "preferred_date": "YYYY-MM-DD format if provided",
  "preferred_time": "HH:MM format if provided, or 'morning'/'afternoon'/'evening'",
  "notes": "any special notes or requests from the customer"
}
[/FUNCTION]

After including the function call, add a friendly confirmation message. The system will execute the booking and provide a confirmation number.

IMPORTANT RULES:
1. If a customer asks to schedule a service NOT in the list above, politely explain you can only schedule the listed services
2. Always collect: service type, preferred date/time before booking
3. Confirm details with the customer before calling the function
4. Include the function call in your response when the customer confirms
`;

  return context;
}
