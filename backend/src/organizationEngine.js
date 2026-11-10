
const REGISTERED_INTEGRATIONS = {
  // Add verified organization integrations here later.
  // Never add an API just because an organization has a website.
  // Each integration must be authorized and tested.
};

function validateWebsite(website) {
  if (!website) return null;

  try {
    const url = new URL(website.trim());

    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function planOrganizationRequest({
  organizationName,
  organizationType,
  website,
  requestType,
  userDetails = {}
}) {
  if (!organizationName || !organizationType || !requestType) {
    return {
      success: false,
      message: "Organization name, type and request type are required."
    };
  }

  const name = organizationName.trim();
  const key = name.toLowerCase();
  const normalizedRequestType = requestType.toLowerCase();

  const isAdmission = normalizedRequestType === "admission";

  const requestLabel = isAdmission
    ? "school or college admission"
    : "appointment";

  const portalSearchPhrase = isAdmission
    ? "official school college university admission application enquiry portal"
    : "official hospital clinic appointment booking portal";

  const integration = REGISTERED_INTEGRATIONS[key];
  const officialWebsite = validateWebsite(website);

  // OPTION 1: An authorized integration exists.
  if (integration && integration.authorized === true) {
    return {
      success: true,
      organization: name,
      organizationType,
      requestType: normalizedRequestType,
      method: "authorized_integration",
      status: "ready_for_user_approval",
      message:
        "A registered organization integration is available. " +
        "The request can be prepared for your approval.",
      requiresApproval: true,
      integration: integration.name
    };
  }

  // OPTION 2: Official website is supplied.
  if (officialWebsite) {
    return {
      success: true,
      organization: name,
      organizationType,
      requestType: normalizedRequestType,
      method: "official_portal",
      status: "portal_review_required",
      message:
        "No authorized direct integration is registered. " +
        `VOXERA can guide you through the organization's official website for your ${requestLabel} request.`,
      officialWebsite,
      requiresApproval: true
    };
  }

  // OPTION 3: Official website or portal discovery is required.
  return {
    success: true,
    organization: name,
    organizationType,
    requestType: normalizedRequestType,
    method: "portal_discovery_required",
    status: "portal_discovery_required",
    message:
      `The organization's website is unknown. ` +
      `VOXERA can help you search for its official ${requestLabel} portal.`,
    requiresApproval: true,
    discoveryRequired: true,
    portalSearchPhrase
  };
}

module.exports = {
  planOrganizationRequest
};
