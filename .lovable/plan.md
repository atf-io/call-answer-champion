
# Plan: Enhance SMS Simulator with CRM Scheduling Context

## Overview
Integrate the agent-level CRM scheduling configuration into the SMS Simulator so that when testing, the AI understands which services it can schedule, which technicians are available, and follows the configured scheduling rules.

## Technical Approach

### Phase 1: Extend Agent Data Model
Store the `AgentCrmConfig` (including scheduling) alongside the agent record so it can be retrieved during simulation.

**Database Change:**
- Add a `crm_config` JSONB column to `ai_agents` table
- This stores the full `AgentCrmConfig` object per agent

### Phase 2: Persist CRM Config on Save
Update `AgentEdit.tsx` to save the CRM configuration when the agent is saved.

**Files Modified:**
- `src/pages/agents/AgentEdit.tsx` - Include `crm_config` in the update payload
- `src/hooks/useAgents.ts` - Add `crm_config` to the Agent interface and update mutation

### Phase 3: Enhance SMS Simulator with Scheduling Context
When starting a simulation, load the agent's CRM config and inject scheduling context into the system prompt.

**Files Modified:**
- `src/pages/agents/SmsSimulator.tsx` - Fetch agent's CRM config and build enhanced prompt

**Context Injection Logic:**
```text
[Injected before existing system prompt]

## Scheduling Capabilities

You can help customers schedule appointments for these services:
- HVAC Service Call ($150, ~60 min)
- AC Installation ($3,500, ~8 hours)
- Furnace Repair ($250, ~2 hours)

Available technicians: John Smith, Sarah Johnson, Mike Williams

When scheduling:
- Offer a {4}-hour arrival window
- Confirm: "{confirmation_message}"
- Assignment rule: {any_available | round_robin | specific}
```

### Phase 4: Add Scheduling Scenario Preset
Add a "Test Scheduling" preset in the simulator that pre-fills the service type with one of the configured services.

**Files Modified:**
- `src/pages/agents/SmsSimulator.tsx` - Add dropdown to select from agent's allowed services

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useAgents.ts` | Modify | Add `crm_config` to Agent interface |
| `src/pages/agents/AgentEdit.tsx` | Modify | Persist CRM config on save |
| `src/pages/agents/SmsSimulator.tsx` | Modify | Inject scheduling context into prompt |
| Database migration | New | Add `crm_config` JSONB column |

## User Experience Flow

1. Configure agent's CRM settings (Products/Services, Technicians)
2. Save agent
3. Go to SMS Simulator
4. Select the agent
5. The AI now knows which services it can schedule and responds accordingly
6. Test a conversation like: "I need to schedule an AC repair"
7. AI responds with available services and scheduling flow

## Technical Details

### Prompt Enhancement Function
```typescript
function buildSchedulingContext(config: AgentSchedulingConfig): string {
  if (!config.enabled || config.allowed_products_or_services.length === 0) {
    return '';
  }
  
  const services = config.allowed_products_or_services
    .map(s => `- ${s.name}`)
    .join('\n');
    
  const technicians = config.allowed_technicians
    .map(t => t.name)
    .join(', ') || 'Any available technician';
    
  return `
## Scheduling Capabilities
You can schedule these services:
${services}

Technicians: ${technicians}
Arrival window: ${config.service_window_hours} hours
${config.require_confirmation ? `Confirmation: "${config.confirmation_message}"` : ''}
`;
}
```

## Testing Scenarios
After implementation, you can test:
1. Ask to schedule an allowed service → AI should proceed with booking flow
2. Ask for a service NOT in the allowed list → AI should explain it's not available
3. Ask about specific technicians → AI responds based on allowed list
4. Ask about timing → AI references the service window configuration
