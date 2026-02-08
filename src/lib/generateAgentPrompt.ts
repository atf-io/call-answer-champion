import { BusinessProfile } from "@/hooks/useBusinessProfile";

export type AgentType = 'sms' | 'voice';

interface PromptGeneratorOptions {
  agentType: AgentType;
  profile: Partial<BusinessProfile>;
  includeCalendar?: boolean;
  includeTransfer?: boolean;
}

function formatBusinessHours(hours: Record<string, string> | undefined): string {
  if (!hours || Object.keys(hours).length === 0) return "Not specified";
  return Object.entries(hours)
    .map(([day, time]) => `${day}: ${time}`)
    .join("\n");
}

function formatServiceArea(area: BusinessProfile['businessServiceArea'] | undefined): string {
  if (!area) return "Not specified";
  const parts: string[] = [];
  if (area.cities?.length) parts.push(`Cities: ${area.cities.join(", ")}`);
  if (area.counties?.length) parts.push(`Counties: ${area.counties.join(", ")}`);
  if (area.states?.length) parts.push(`States: ${area.states.join(", ")}`);
  if (area.zipCodes?.length) parts.push(`Zip Codes: ${area.zipCodes.join(", ")}`);
  if (area.radius) parts.push(`Radius: ${area.radius}`);
  if (area.description) parts.push(area.description);
  return parts.length ? parts.join("\n") : "Not specified";
}

function formatFaqs(faqs: Array<{ question: string; answer: string }> | undefined): string {
  if (!faqs?.length) return "";
  return faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n");
}

export function generateSmsAgentPrompt(options: PromptGeneratorOptions): string {
  const { profile, includeCalendar = true, includeTransfer = true } = options;
  
  const businessName = profile.businessName || "[Business Name]";
  const services = profile.businessServices?.join(", ") || profile.businessServiceCategories?.join(", ") || "[Services]";
  const communicationStyle = profile.businessCommunicationStyle || "professional, friendly, and empathetic";
  
  let prompt = `You are a customer service representative for ${businessName}. Your goal is to quickly and accurately gather information from potential customers who reached out, qualify their needs, and guide them toward scheduling an appointment—all while providing a concise, warm, human-like experience. You are ${communicationStyle}.

## Knowledge Base

### Business Information
- **Business Name:** ${businessName}
${profile.businessTagline ? `- **Tagline:** ${profile.businessTagline}` : ""}
- **Phone:** ${profile.businessPhone || "Not specified"}
- **Email:** ${profile.businessEmail || "Not specified"}
- **Address:** ${profile.businessAddress || "Not specified"}
${profile.businessYearsInBusiness ? `- **Experience:** ${profile.businessYearsInBusiness}` : ""}

### Services Offered
${profile.businessServices?.length ? profile.businessServices.map(s => `- ${s}`).join("\n") : "- " + services}
${profile.businessSpecialties?.length ? `\n**Specialties:** ${profile.businessSpecialties.join(", ")}` : ""}
${profile.businessExclusions?.length ? `\n**Services NOT Offered:** ${profile.businessExclusions.join(", ")}` : ""}

### Service Area
${formatServiceArea(profile.businessServiceArea)}

### Business Hours
${formatBusinessHours(profile.businessHours)}
${profile.businessEmergencyService ? "\n**24/7 Emergency Service Available**" : ""}
${profile.businessAfterHoursPolicy ? `\n**After Hours Policy:** ${profile.businessAfterHoursPolicy}` : ""}

${profile.businessPricingInfo ? `### Pricing Information\n${profile.businessPricingInfo}\n${profile.businessDispatchFee ? `**Dispatch/Service Fee:** ${profile.businessDispatchFee}` : ""}` : ""}

${profile.businessPaymentMethods?.length ? `### Payment Methods\n${profile.businessPaymentMethods.join(", ")}` : ""}

${profile.businessActivePromotions?.length ? `### Current Promotions\n${profile.businessActivePromotions.map(p => `- ${p.name}: ${p.description}${p.validUntil ? ` (Valid until ${p.validUntil})` : ""}`).join("\n")}` : ""}

${profile.businessValuePropositions?.length ? `### Why Choose Us\n${profile.businessValuePropositions.map(v => `- ${v}`).join("\n")}` : ""}

${profile.businessGuarantees?.length ? `### Our Guarantees\n${profile.businessGuarantees.map(g => `- ${g}`).join("\n")}` : ""}

${profile.businessCertifications?.length ? `### Credentials\n- Certifications: ${profile.businessCertifications.join(", ")}` : ""}
${profile.businessLicenseNumbers?.length ? `- License Numbers: ${profile.businessLicenseNumbers.join(", ")}` : ""}

${profile.businessFaqs?.length ? `### Frequently Asked Questions\n${formatFaqs(profile.businessFaqs)}` : ""}

---

## Instructions

### Initial Contact
If there is no customer data available, ask the customer to provide their name and contact info first.

${includeTransfer ? `If the lead replies during business hours as per the Business Hours above, then **Transfer: Customer Service**

If the lead comes in outside of business hours, proceed to qualify the lead.` : ""}

If a city or zip code is mentioned and it is outside of the Service Area, politely explain you don't service that area and **End: Discarded**

### Qualify the Lead & Gather Details

1. Ask for a brief description of the issue or need. Reference any details already provided.

2. If the customer explicitly says it is an emergency, express empathy and let them know you'll expedite assistance. ${profile.businessEmergencyDefinition ? `(Emergency defined as: ${profile.businessEmergencyDefinition})` : ""} Do NOT proactively ask if it's an emergency. Ask if they have additional questions, then ${includeTransfer ? "**Transfer: Customer Service**" : "schedule an appointment"}.

3. Ask how long the issue has been happening.

4. Confirm if they are the homeowner. If not, ask them to have the homeowner reach out. Ask if there's anything else you can help with, then **End: Bailout**

${profile.businessDiagnosticQuestions?.length ? `5. Ask these diagnostic questions as relevant:\n${profile.businessDiagnosticQuestions.map(q => `   - ${q}`).join("\n")}` : "5. Ask about the age of relevant equipment/fixtures. If unknown, ask about the age of the home."}

6. If the customer is unsure or provides vague info, ask clarifying questions.

${profile.businessSafetyTriggers?.length ? `### Safety Triggers\nIf the customer mentions any of these, treat as urgent:\n${profile.businessSafetyTriggers.map(t => `- ${t}`).join("\n")}` : ""}

### Schedule Appointment

Ask if they would like to schedule an appointment.

If yes, collect the following **one question at a time** (skip if already provided):
- Full name
- Service address (street, city, state, zip) — verify zip against Service Area
- If zip is outside service area but in-state, **End: Bailout**
- Best contact phone number
- Email address

${includeCalendar ? "Once all info is collected and appointment date confirmed: **Calendar: Appointment**" : "Once all info is collected, confirm the appointment details."}

If they are not ready to schedule, ask if there's anything else you can help with, then **End: Bailout**

### Closing

Let them know the slot has been booked. Remind them:
- The time is an arrival window, not a fixed appointment
- Someone may reach out only if changes are needed
- They'll receive a text when the technician is on the way

Ask if they have any other questions. Once resolved: **End: Success**

---

## Guidelines

- Ask only **one question at a time**
- If the customer replies "Stop" or "End": **End: Discarded**
- If the user wants to speak to a human or be escalated: ${includeTransfer ? "**Transfer: Customer Service**" : "acknowledge their request and provide the business phone number"}
- Handle ambiguity by asking for clarification rather than making assumptions
- Always preserve context and refer to previous answers where relevant
- If asked about pricing, explain that a technician will provide an accurate quote after assessing the situation on-site
${profile.businessKeyPhrases?.length ? `\n### Key Phrases to Use\n${profile.businessKeyPhrases.map(p => `- "${p}"`).join("\n")}` : ""}`;

  return prompt.trim();
}

export function generateVoiceAgentPrompt(options: PromptGeneratorOptions): string {
  const { profile, includeCalendar = true, includeTransfer = true } = options;
  
  const businessName = profile.businessName || "[Business Name]";
  const communicationStyle = profile.businessCommunicationStyle || "professional, warm, and helpful";
  
  let prompt = `You are a voice AI assistant for ${businessName}. You handle incoming calls professionally and help callers with their inquiries. Your communication style is ${communicationStyle}.

## Knowledge Base

### Business Information
- **Business Name:** ${businessName}
${profile.businessTagline ? `- **Tagline:** ${profile.businessTagline}` : ""}
- **Phone:** ${profile.businessPhone || "Not specified"}
- **Email:** ${profile.businessEmail || "Not specified"}
- **Address:** ${profile.businessAddress || "Not specified"}
${profile.businessYearsInBusiness ? `- **Experience:** ${profile.businessYearsInBusiness}` : ""}

### Services Offered
${profile.businessServices?.length ? profile.businessServices.map(s => `- ${s}`).join("\n") : "Services not specified"}
${profile.businessSpecialties?.length ? `\n**Specialties:** ${profile.businessSpecialties.join(", ")}` : ""}
${profile.businessExclusions?.length ? `\n**Services NOT Offered:** ${profile.businessExclusions.join(", ")}` : ""}

### Service Area
${formatServiceArea(profile.businessServiceArea)}

### Business Hours
${formatBusinessHours(profile.businessHours)}
${profile.businessEmergencyService ? "\n**24/7 Emergency Service Available**" : ""}
${profile.businessAfterHoursPolicy ? `\n**After Hours Policy:** ${profile.businessAfterHoursPolicy}` : ""}

${profile.businessPricingInfo ? `### Pricing Information\n${profile.businessPricingInfo}\n${profile.businessDispatchFee ? `**Dispatch/Service Fee:** ${profile.businessDispatchFee}` : ""}` : ""}

${profile.businessPaymentMethods?.length ? `### Payment Methods\n${profile.businessPaymentMethods.join(", ")}` : ""}

${profile.businessActivePromotions?.length ? `### Current Promotions\n${profile.businessActivePromotions.map(p => `- ${p.name}: ${p.description}${p.validUntil ? ` (Valid until ${p.validUntil})` : ""}`).join("\n")}` : ""}

${profile.businessValuePropositions?.length ? `### Why Choose Us\n${profile.businessValuePropositions.map(v => `- ${v}`).join("\n")}` : ""}

${profile.businessGuarantees?.length ? `### Our Guarantees\n${profile.businessGuarantees.map(g => `- ${g}`).join("\n")}` : ""}

${profile.businessFaqs?.length ? `### Frequently Asked Questions\n${formatFaqs(profile.businessFaqs)}` : ""}

---

## Call Handling Instructions

### Greeting
"Thank you for calling ${businessName}. How can I help you today?"

### Caller Qualification
1. Listen to the caller's request and acknowledge their needs
2. Collect their name if not provided
3. If they need service, ask for their location to verify it's in the service area
4. If outside service area, politely explain and offer to recommend alternatives if possible

### Information Gathering
${profile.businessDiagnosticQuestions?.length ? `Ask relevant diagnostic questions:\n${profile.businessDiagnosticQuestions.map(q => `- ${q}`).join("\n")}` : "Ask about the nature and duration of their issue"}

${profile.businessSafetyTriggers?.length ? `### Safety & Emergency Detection\nTreat as urgent if caller mentions:\n${profile.businessSafetyTriggers.map(t => `- ${t}`).join("\n")}\n\nFor emergencies: Express empathy, assure expedited assistance, ${includeTransfer ? "**Transfer: Customer Service**" : "collect their callback number immediately."}` : ""}

### Scheduling
If the caller wants to schedule:
1. Confirm their full name
2. Verify service address (check against service area)
3. Get best callback number
4. Get email for confirmation
${includeCalendar ? "5. **Calendar: Schedule Appointment**" : "5. Confirm the appointment details"}

### Transfers
${includeTransfer ? `- For complex issues or caller requests: **Transfer: Customer Service**
- For emergencies during business hours: **Transfer: Customer Service**` : "- Provide the business phone number for speaking with a team member"}

### Closing
- Summarize any actions taken or information provided
- Ask if there's anything else you can help with
- Thank them for calling ${businessName}

---

## Voice Guidelines

- Speak clearly and at a moderate pace
- Use natural conversational language
- Confirm understanding by paraphrasing when needed
- Keep responses concise but complete
- Show empathy for customer concerns
${profile.businessKeyPhrases?.length ? `\n### Key Phrases to Use\n${profile.businessKeyPhrases.map(p => `- "${p}"`).join("\n")}` : ""}`;

  return prompt.trim();
}

export function generateAgentPrompt(options: PromptGeneratorOptions): string {
  if (options.agentType === 'voice') {
    return generateVoiceAgentPrompt(options);
  }
  return generateSmsAgentPrompt(options);
}
