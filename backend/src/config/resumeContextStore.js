
const resumeContexts = new Map();

function saveResumeContext(sessionId, context) {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("A valid session ID is required.");
  }

  if (!context || typeof context !== "string") {
    throw new Error("Resume context must be text.");
  }

  resumeContexts.set(sessionId, context);
}

function getResumeContext(sessionId) {
  return resumeContexts.get(sessionId) || "";
}

function clearResumeContext(sessionId) {
  resumeContexts.delete(sessionId);
}

module.exports = {
  saveResumeContext,
  getResumeContext,
  clearResumeContext
};

