const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  planOrganizationRequest
} = require("./organizationEngine");

const sessions = new Map();

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "voxera-records.json");

// --------------------------------------
// RECORD STORAGE
// --------------------------------------

function readRecords() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];

    const records = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error("Could not read VOXERA records:", error.message);
    return [];
  }
}

function saveRecord(record) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const records = readRecords();
  records.push(record);

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(records, null, 2)
  );
}

// --------------------------------------
// PORTAL SEARCH URL
// --------------------------------------

function createPortalSearchUrl(session) {
  const details = session.details;

  const organizationName =
    session.intent === "appointment"
      ? details.providerName
      : details.schoolName;

  const location = details.location || "";

  const searchPhrase =
    session.intent === "admission"
      ? "official school college admission application enquiry portal"
      : "official hospital clinic appointment booking portal";

  const query = [
    organizationName,
    location,
    searchPhrase
  ]
    .filter(Boolean)
    .join(" ");

  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);

  return url.toString();
}

// --------------------------------------
// WORKFLOW DEFINITIONS
// --------------------------------------

const workflows = {
  appointment: {
    title: "appointment request",
    organizationType: "hospital_or_service_provider",
    fields: [
      [
        "providerName",
        "Which hospital, clinic or service provider do you prefer?"
      ],
      [
        "location",
        "Which city or area is this hospital or clinic located in?"
      ],
      [
        "purpose",
        "What type of appointment do you need?"
      ],
      [
        "preferredDate",
        "What date would you prefer?"
      ],
      [
        "preferredTime",
        "What time would you prefer?"
      ],
      [
        "fullName",
        "May I have your full name?"
      ],
      [
        "contact",
        "What phone number or email should the provider use to contact you?"
      ],
      [
        "website",
        "Do you know the provider's website? Enter its HTTPS address, or type I don't know."
      ]
    ]
  },

  admission: {
    title: "school or college admission enquiry",
    organizationType: "school",
    fields: [
      [
        "schoolName",
        "Which school, college or university are you interested in?"
      ],
      [
        "location",
        "Which city or area is the institution located in?"
      ],
      [
        "studentName",
        "What is the student's name?"
      ],
      [
        "grade",
        "Which class, grade or course are you seeking admission for?"
      ],
      [
        "guardianName",
        "May I have the parent or guardian's name?"
      ],
      [
        "contact",
        "What phone number or email should the institution use to contact you?"
      ],
      [
        "website",
        "Do you know the institution's website? Enter its HTTPS address, or type I don't know."
      ]
    ]
  }
};

// --------------------------------------
// INTENT DETECTION
// --------------------------------------

function detectIntent(message) {
  const text = message.toLowerCase().trim();

  // Job and resume actions
  if (
    /\b(analyze|analyse|upload|review|improve|update|build|create|prepare|submit|apply|search|find)\b/.test(text) &&
    /\b(resume|cv|job|jobs|career|application|vacanc(?:y|ies))\b/.test(text)
  ) {
    return "job";
  }

  // School, college and university admissions
  if (
    /\b(apply|start|begin|submit|prepare|create|send|make|find|search|enroll|enrol|register)\b/.test(text) &&
    /\b(admission|school|college|university|enrollment|enrolment)\b/.test(text)
  ) {
    return "admission";
  }

  // Appointment requests
  if (
    /\b(book|schedule|arrange|make|find|request|set up)\b/.test(text) &&
    /\b(appointment|doctor|hospital|clinic|consultation)\b/.test(text)
  ) {
    return "appointment";
  }

  if (
    /\b(appointment|consultation)\b/.test(text) &&
    /\b(need|want|like)\b/.test(text)
  ) {
    return "appointment";
  }

  return null;
}

// --------------------------------------
// EXTRACT INFORMATION FROM FIRST MESSAGE
// --------------------------------------

function extractInitialDetails(message, intent) {
  const details = {};
  const text = message.trim();

  if (intent === "admission") {
    const patterns = [
      /\b(?:in|at|from|for)\s+(.+?\b(?:school|college|university))\b/i,
      /\b(?:admission|enquiry|enrollment|enrolment)\s+(?:in|at|for)\s+(.+?\b(?:school|college|university))\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);

      if (match) {
        details.schoolName = match[1].trim();
        break;
      }
    }

    const studentMatch = text.match(
      /\b(?:student|child)(?:'s)?\s+(?:name\s+is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/
    );

    if (studentMatch) {
      details.studentName = studentMatch[1].trim();
    }

    const gradeMatch = text.match(
      /\b(?:class|grade|course)\s*(?:number\s*)?([0-9]{1,2}|[a-z]+)\b/i
    );

    if (gradeMatch) {
      details.grade = gradeMatch[1].trim();
    }
  }

  if (intent === "appointment") {
    const providerMatch = text.match(
      /\b(?:at|in|from)\s+(.+?\b(?:hospital|clinic))\b/i
    );

    if (providerMatch) {
      details.providerName = providerMatch[1].trim();
    }

    const purposeMatch = text.match(
      /\b(?:for|about)\s+(?:a\s+)?(.+?)(?:\s+at\s+|\s+on\s+|\s+tomorrow|\s+next week|$)/i
    );

    if (purposeMatch && !details.providerName) {
      details.purpose = purposeMatch[1].trim();
    }

    const dateMatch = text.match(
      /\b(today|tomorrow|next week|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i
    );

    if (dateMatch) {
      details.preferredDate = dateMatch[1];
    }

    const timeMatch = text.match(
      /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i
    );

    if (timeMatch) {
      details.preferredTime = timeMatch[1];
    }
  }

  const websiteMatch = text.match(
    /https:\/\/[^\s]+/i
  );

  if (websiteMatch) {
    details.website = websiteMatch[0].replace(/[.,!?]+$/, "");
  }

  const emailMatch = text.match(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  );

  if (emailMatch) {
    details.contact = emailMatch[0];
  }

  const phoneMatch = text.match(
    /\b(?:\+?\d[\d\s-]{8,14}\d)\b/
  );

  if (phoneMatch) {
    details.contact = phoneMatch[0].trim();
  }

  return details;
}

// --------------------------------------
// WORKFLOW HELPERS
// --------------------------------------

function getOrganizationName(session) {
  return session.intent === "appointment"
    ? session.details.providerName
    : session.details.schoolName;
}

function getSummary(session) {
  const details = session.details;

  if (session.intent === "appointment") {
    return [
      "Hospital/provider: " + details.providerName,
      "Location: " + details.location,
      "Appointment purpose: " + details.purpose,
      "Preferred date: " + details.preferredDate,
      "Preferred time: " + details.preferredTime,
      "Name: " + details.fullName,
      "Contact: " + details.contact,
      "Website: " + details.website
    ];
  }

  return [
    "School/college/university: " + details.schoolName,
    "Location: " + details.location,
    "Student: " + details.studentName,
    "Class/grade/course: " + details.grade,
    "Parent/guardian: " + details.guardianName,
    "Contact: " + details.contact,
    "Website: " + details.website
  ];
}

function getNextQuestion(session) {
  const workflow = workflows[session.intent];

  while (session.fieldIndex < workflow.fields.length) {
    const [field, question] =
      workflow.fields[session.fieldIndex];

    if (
      typeof session.details[field] === "string" &&
      session.details[field].trim()
    ) {
      session.fieldIndex++;
      continue;
    }

    return question;
  }

  return null;
}

function startWorkflow(sessionId, intent, initialMessage) {
  const session = {
    intent,
    fieldIndex: 0,
    details: extractInitialDetails(initialMessage, intent),
    awaitingConfirmation: false,
    organizationPlan: null
  };

  sessions.set(sessionId, session);

  const nextQuestion = getNextQuestion(session);

  if (nextQuestion) {
    return {
      reply: nextQuestion,
      status: "collecting_details",
      intent,
      collectedDetails: session.details
    };
  }

  return finishWorkflow(session);
}

// --------------------------------------
// ORGANIZATION PLANNING
// --------------------------------------

function prepareOrganizationPlan(session) {
  const workflow = workflows[session.intent];
  const details = session.details;

  const website = details.website &&
    ![
      "i don't know",
      "dont know",
      "unknown",
      "no",
      "none"
    ].includes(details.website.trim().toLowerCase())
      ? details.website.trim()
      : null;

  const plan = planOrganizationRequest({
    organizationName: getOrganizationName(session),
    organizationType: workflow.organizationType,
    website,
    location: details.location,
    requestType: session.intent,
    userDetails: {
      name: details.fullName || details.guardianName,
      email: details.contact,
      phone: details.contact
    }
  });

  return {
    ...plan,
    location: details.location || null,
    portalSearchUrl: plan.discoveryRequired
      ? createPortalSearchUrl(session)
      : null,
    portalSearchType:
      session.intent === "admission"
        ? "admission"
        : "appointment"
  };
}

function finishWorkflow(session) {
  session.organizationPlan = prepareOrganizationPlan(session);
  session.awaitingConfirmation = true;

  const plan = session.organizationPlan;

  return {
    reply:
      "I've prepared your request and checked the available integration information. " +
      plan.message +
      " Please review your details and approve saving this request. " +
      "This does not submit an application or confirm an appointment.",
    status: "awaiting_confirmation",
    intent: session.intent,
    summary: getSummary(session),
    organizationPlan: plan
  };
}

// --------------------------------------
// MAIN MESSAGE HANDLER
// --------------------------------------

function handleMessage(sessionId, message) {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("A valid session ID is required.");
  }

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error("Please enter a message.");
  }

  const text = message.trim();
  let session = sessions.get(sessionId);

  // Start a new workflow.
  if (!session) {
    const intent = detectIntent(text);

    if (
      intent === "appointment" ||
      intent === "admission"
    ) {
      return startWorkflow(sessionId, intent, text);
    }

    if (intent === "job") {
      return {
        reply:
          "I can help analyze your resume, find relevant job opportunities and prepare customized applications. You will review and approve each application before submission.",
        status: "job_workflow_ready_for_resume",
        intent: "job"
      };
    }

    // Normal conversation fallback.
    const lowerText = text.toLowerCase();
    let reply;

    if (
      /^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(lowerText)
    ) {
      reply =
        "Hello! I'm VOXERA, your AI assistant. We can chat normally, or I can help organize appointments, admissions and job applications. What would you like to explore?";
    } else if (
      /\b(thank you|thanks)\b/.test(lowerText)
    ) {
      reply = "You're welcome! What else can I help you with?";
    } else if (
      /\b(who are you|what is voxera|what can you do)\b/.test(lowerText)
    ) {
      reply =
        "I'm VOXERA, a universal AI task orchestration platform. I can organize requests into structured workflows, collect details and ask for your approval before saving a request. My general-purpose conversational AI is not connected yet.";
    } else {
      reply =
        "I understand! I can help organize appointments, admissions and job applications. My general-purpose conversational AI is not connected yet, so I cannot reliably answer arbitrary questions at this stage.";
    }

    return {
      reply,
      status: "conversation",
      intent: null
    };
  }

  // Handle confirmation.
  if (session.awaitingConfirmation) {
    const answer = text.toLowerCase();

    if (
      ["yes", "confirm", "approve", "yes confirm", "proceed"].includes(answer)
    ) {
      return confirmWorkflow(sessionId, true);
    }

    if (
      ["no", "cancel", "reject", "no cancel"].includes(answer)
    ) {
      return confirmWorkflow(sessionId, false);
    }

    return {
      reply:
        "Would you like me to save this request? Reply YES to approve or NO to cancel.",
      status: "awaiting_confirmation",
      summary: getSummary(session),
      organizationPlan: session.organizationPlan
    };
  }

  // Save the answer to the current question.
  const workflow = workflows[session.intent];

  if (
    !workflow ||
    session.fieldIndex >= workflow.fields.length
  ) {
    sessions.delete(sessionId);

    return {
      reply:
        "Let's start your request again. What would you like help with?",
      status: "awaiting_intent"
    };
  }

  const currentField =
    workflow.fields[session.fieldIndex][0];

  session.details[currentField] = text;
  session.fieldIndex++;

  const nextQuestion = getNextQuestion(session);

  if (nextQuestion) {
    return {
      reply: nextQuestion,
      status: "collecting_details",
      intent: session.intent,
      collectedDetails: session.details
    };
  }

  return finishWorkflow(session);
}

// --------------------------------------
// CONFIRM OR CANCEL
// --------------------------------------

function confirmWorkflow(sessionId, approved) {
  const session = sessions.get(sessionId);

  if (
    !session ||
    !session.awaitingConfirmation
  ) {
    return {
      reply: "There is no request waiting for confirmation.",
      status: "no_pending_request"
    };
  }

  if (!approved) {
    sessions.delete(sessionId);

    return {
      reply:
        "No request was saved. You can start again whenever you are ready.",
      status: "cancelled"
    };
  }

  const record = {
    id: crypto.randomUUID(),
    type: session.intent,
    details: session.details,
    organizationPlan: session.organizationPlan,
    status: "request_saved_pending_external_action",
    createdAt: new Date().toISOString()
  };

  saveRecord(record);
  sessions.delete(sessionId);

  return {
    reply:
      "Your request has been saved in VOXERA. " +
      "It has not yet been submitted to the organization. " +
      "Use the organization's official process or a supported integration to complete the external action.",
    status: record.status,
    referenceId: record.id,
    organizationPlan: record.organizationPlan
  };
}

module.exports = {
  handleMessage,
  confirmWorkflow
};