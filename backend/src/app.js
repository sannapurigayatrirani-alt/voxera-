
const express = require("express");
const cors = require("cors");
const organizationRoutes = require("./routes/organizationRoutes");
const organizationDiscoveryRoutes = require("./routes/organizationDiscoveryRoutes");
const {
  getResumeContext
} = require("./config/resumeContextStore");
const { streamReply } = require("./llmService");

const {
  handleMessage,
  confirmWorkflow
} = require("./taskEngine");

const resumeRoutes = require("./routes/resumeRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VOXERA backend is running",
    platform: "VOXERA"
  });
});

// Assistant chat

app.post("/api/assistant/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: "sessionId and message are required."
      });
    }

    const result = handleMessage(sessionId, message);

    // Existing workflows continue using normal JSON responses.
    if (
  result.status !== "conversation" &&
  result.status !== "awaiting_intent" &&
  result.status !== "job_workflow_ready_for_resume"
) {
      return res.status(200).json({
        success: true,
        ...result
      });
    }

    // Stream normal conversational responses from Ollama.
    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    const resumeContext = getResumeContext(sessionId);

await streamReply(
  sessionId,
  message,
  token => {
    if (!res.destroyed) res.write(token);
  },
  resumeContext
);

    if (!res.destroyed) {
      res.end();
    }

  } catch (error) {
    console.error("Assistant error:", error.message);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: error.message || "VOXERA could not process your request."
    });
  }
});


// Workflow confirmation
app.post("/api/assistant/confirm", (req, res) => {
  try {
    const { sessionId, approved } = req.body;

    if (!sessionId || typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "sessionId and a true/false approved value are required."
      });
    }

    const result = confirmWorkflow(sessionId, approved);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Confirmation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not process the confirmation."
    });
  }
});

// Resume upload and analysis
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/organizations/discovery", organizationDiscoveryRoutes);

module.exports = app;
