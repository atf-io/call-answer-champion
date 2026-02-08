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

IMPORTANT: If a customer asks to schedule a service that is NOT in the list above, politely explain that you can only schedule the services listed and offer to help with those instead.
`;

  return context;
}
