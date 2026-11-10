
const express = require("express");

const {
  readApplications,
  writeApplications,
  createApplication
} = require("../config/applicationStore");

const router = express.Router();

const ALLOWED_STATUSES = [
  "prepared",
  "reviewed",
  "portal_opened",
  "submitted",
  "interview",
  "rejected",
  "offer_received"
];

function cleanText(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// GET all saved applications
router.get("/", (req, res) => {
  try {
    const applications = readApplications();

    return res.json({
      success: true,
      total: applications.length,
      applications
    });
  } catch (error) {
    console.error("Tracker fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load applications."
    });
  }
});

// Save a prepared application
router.post("/", (req, res) => {
  try {
    const { job, applicant, applicationDraft, officialApplyUrl } =
      req.body || {};

    if (!job || !applicant) {
      return res.status(400).json({
        success: false,
        message: "Job and applicant details are required."
      });
    }

    const title = cleanText(job.title, 200);
    const company = cleanText(job.company, 200);
    const name = cleanText(applicant.name, 150);
    const email = cleanText(applicant.email, 200);

    if (!title || !company || !name || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid job, company, name, and email details are required."
      });
    }

    const portalUrl =
      typeof officialApplyUrl === "string" &&
      isValidHttpUrl(officialApplyUrl)
        ? officialApplyUrl
        : null;

    const application = createApplication({
      job: {
        title,
        company,
        location: cleanText(job.location, 200),
        source: cleanText(job.source, 100)
      },
      applicant: {
        name,
        email,
        phone: cleanText(applicant.phone, 40)
      },
      applicationDraft: cleanText(applicationDraft, 15000),
      officialApplyUrl: portalUrl,
      statusHistory: [
        {
          status: "prepared",
          date: new Date().toISOString()
        }
      ],
      portalOpenedAt: null,
      submittedAt: null
    });

    return res.status(201).json({
      success: true,
      message: "Application saved to VOXERA Tracker.",
      application
    });
  } catch (error) {
    console.error("Tracker save error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not save this application."
    });
  }
});

// Update an application's status
router.patch("/:id/status", (req, res) => {
  try {
    const { status, confirmed } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status."
      });
    }

    if (status === "submitted" && confirmed !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Confirm that you personally submitted the application first."
      });
    }

    const applications = readApplications();

    const index = applications.findIndex(
      item => item.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Application not found."
      });
    }

    const now = new Date().toISOString();

    applications[index].status = status;
    applications[index].updatedAt = now;

    applications[index].statusHistory =
      applications[index].statusHistory || [];

    applications[index].statusHistory.push({
      status,
      date: now
    });

    if (status === "portal_opened") {
      applications[index].portalOpenedAt = now;
    }

    if (status === "submitted") {
      applications[index].submittedAt = now;
    }

    writeApplications(applications);

    return res.json({
      success: true,
      message: "Application status updated.",
      application: applications[index]
    });
  } catch (error) {
    console.error("Tracker update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update application status."
    });
  }
});

module.exports = router;
