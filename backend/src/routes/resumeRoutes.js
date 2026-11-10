
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const {
  saveResumeContext
} = require("../config/resumeContextStore");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (allowed.includes(file.mimetype)) {
      return callback(null, true);
    }

    callback(new Error("Upload a PDF or DOCX resume only."));
  }
});

const SKILL_BANK = [
  "python",
  "javascript",
  "typescript",
  "react",
  "node.js",
  "express",
  "mongodb",
  "sql",
  "mysql",
  "html",
  "css",
  "java",
  "fastapi",
  "django",
  "rest api",
  "git",
  "machine learning",
  "llm",
  "artificial intelligence"
];

function unique(values) {
  return [...new Set(
    values.map(value => value.trim()).filter(Boolean)
  )];
}

function cleanText(value, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Detect how the employer accepts applications.
function detectApplicationMethod(job) {
  const description = job.description || "";

  const emailRegex =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const emails = [...new Set(description.match(emailRegex) || [])];

  const applicationKeywords =
    /\b(apply|application|send your resume|send your cv|email your resume|submit your resume|forward your cv|contact to apply)\b/i;

  let applicationEmail = null;

  for (const email of emails) {
    const emailIndex = description.indexOf(email);

    const context = description.slice(
      Math.max(0, emailIndex - 180),
      Math.min(
        description.length,
        emailIndex + email.length + 180
      )
    );

    if (applicationKeywords.test(context)) {
      applicationEmail = email;
      break;
    }
  }

  if (applicationEmail) {
    return {
      applicationMethod: "email",
      applicationEmail,
      applicationUrl: null,
      applicationInstructions:
        `Prepare an email to ${applicationEmail}. Verify the employer's instructions before sending.`
    };
  }

  const validUrl =
    typeof job.applyUrl === "string" &&
    isValidHttpUrl(job.applyUrl);

  if (validUrl) {
    return {
      applicationMethod: "external_link",
      applicationEmail: null,
      applicationUrl: job.applyUrl,
      applicationInstructions:
        "Open the external job listing or application link and verify the employer's application process."
    };
  }

  return {
    applicationMethod: "manual",
    applicationEmail: null,
    applicationUrl: null,
    applicationInstructions:
      "No application method could be reliably detected. Check the original job listing."
  };
}

function extractProfile(text) {
  const lower = text.toLowerCase();

  const skills = SKILL_BANK.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(
      `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
      "i"
    ).test(lower);
  });

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const education = unique(
    lines.filter(line =>
      /\b(mca|b\.tech|btech|bachelor|master|degree|university|college|diploma|education)\b/i.test(line)
    )
  ).slice(0, 6);

  const experience = unique(
    lines.filter(line =>
      /\b(intern|experience|developer|engineer|worked|employment|professional)\b/i.test(line)
    )
  ).slice(0, 6);

  return {
    skills,
    education,
    experience,
    textLength: text.length
  };
}

function calculateMatch(job, profile) {
  const description = [
    job.title,
    job.description,
    job.tags?.join(" "),
    job.category
  ].filter(Boolean).join(" ").toLowerCase();

  const matchedSkills = profile.skills.filter(skill =>
    description.includes(skill.toLowerCase())
  );

  const score = profile.skills.length
    ? Math.round(
        (matchedSkills.length / profile.skills.length) * 100
      )
    : 0;

  return {
    ...job,
    matchedSkills,
    matchScore: score
  };
}

// Prepare an application package without submitting it.
function prepareApplication(job, applicant) {
  const title = cleanText(job.title, 200);
  const company = cleanText(job.company, 200);
  const location = cleanText(job.location, 200);

  const name = cleanText(applicant.name, 150);
  const email = cleanText(applicant.email, 200);
  const phone = cleanText(applicant.phone, 40);

  const skills = Array.isArray(applicant.skills)
    ? unique(applicant.skills
        .filter(skill => typeof skill === "string")
        .map(skill => cleanText(skill, 80))
        .filter(Boolean))
    : [];

  const education = Array.isArray(applicant.education)
    ? applicant.education
        .filter(item => typeof item === "string")
        .map(item => cleanText(item, 300))
        .filter(Boolean)
    : [];

  const experience = Array.isArray(applicant.experience)
    ? applicant.experience
        .filter(item => typeof item === "string")
        .map(item => cleanText(item, 300))
        .filter(Boolean)
    : [];

  const projects = Array.isArray(applicant.projects)
    ? applicant.projects
        .filter(item => typeof item === "string")
        .map(item => cleanText(item, 300))
        .filter(Boolean)
    : [];

  const method = detectApplicationMethod(job);

  // Use a detected email only when the supplied address is valid.
  const applicationEmail =
    isValidEmail(cleanText(job.applicationEmail, 200))
      ? cleanText(job.applicationEmail, 200)
      : method.applicationEmail;

  const applicationUrl =
    isValidHttpUrl(cleanText(job.applicationUrl, 2000))
      ? cleanText(job.applicationUrl, 2000)
      : method.applicationUrl;

  const applicationMethod =
    ["email", "external_link", "manual"].includes(job.applicationMethod)
      ? job.applicationMethod
      : method.applicationMethod;

  const subject = title && company
    ? `${title} @ ${company}`
    : title
      ? `Application for ${title}`
      : "Job Application";

  const profileSummary = [
    education.length
      ? `Education: ${education.join("; ")}`
      : "",
    skills.length
      ? `Skills: ${skills.join(", ")}`
      : "",
    experience.length
      ? `Experience: ${experience.join("; ")}`
      : "",
    projects.length
      ? `Projects: ${projects.join("; ")}`
      : ""
  ].filter(Boolean).join("\n");

  const coverLetter = [
    "Dear Hiring Team,",
    "",
    `I am interested in applying for the ${title || "available"} position${company ? ` at ${company}` : ""}.`,
    "",
    "My background and details are provided below for your consideration:",
    "",
    profileSummary || "Please refer to my attached resume for my education, skills, and project details.",
    "",
    "I would welcome the opportunity to discuss how my background aligns with the requirements of this role.",
    "",
    "Thank you for your time and consideration.",
    "",
    "Sincerely,",
    name,
    email,
    phone
  ].filter(value => value !== null && value !== undefined).join("\n");

  const emailBody = [
    "Dear Hiring Team,",
    "",
    `I am writing to apply for the ${title || "available position"}${company ? ` at ${company}` : ""}.`,
    "",
    "Please find my resume attached for your consideration.",
    "",
    "I would appreciate the opportunity to discuss my application and suitability for this role.",
    "",
    "Thank you for your time.",
    "",
    "Regards,",
    name,
    email,
    phone
  ].join("\n");

  const checklist = [
    "Review the job title, company, and application instructions.",
    "Verify that your resume is the correct and latest version.",
    "Check all personal and qualification details.",
    "Review the generated cover letter or email before using it.",
    "Complete any employer-specific questions truthfully.",
    "Submit only through the employer's official process.",
    "Save the employer's confirmation after successful submission."
  ];

  return {
    success: true,
    status: "awaiting_review",
    job: {
      title,
      company,
      location
    },
    applicant: {
      name,
      email,
      phone
    },
    application: {
      method: applicationMethod,
      recipient: applicationMethod === "email"
        ? applicationEmail
        : null,
      subject,
      emailBody: applicationMethod === "email"
        ? emailBody
        : null,
      coverLetter,
      applicationUrl:
        applicationMethod === "external_link"
          ? applicationUrl
          : null,
      instructions: method.applicationInstructions,
      checklist
    },
    profileSummary,
    notice:
      "This is a draft for review only. VOXERA has not sent an email, submitted a form, or applied for this job. Verify every detail before proceeding."
  };
}

async function fetchWithTimeout(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      Accept: "application/json",
      "User-Agent": "VOXERA-JobDiscovery/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Job source returned HTTP ${response.status}`);
  }

  return response.json();
}

// Remote job source.
async function getRemotiveJobs(searchTerm) {
  const url = new URL("https://remotive.com/api/remote-jobs");

  if (searchTerm) {
    url.searchParams.set("search", searchTerm);
  }

  const data = await fetchWithTimeout(url.toString());

  return (data.jobs || []).map(job => ({
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Remote",
    type: job.job_type || "Not specified",
    description: job.description || "",
    tags: job.tags || [],
    applyUrl: job.url,
    source: "Remotive",
    publishedAt: job.publication_date || null
  }));
}

// Additional job source.
async function getArbeitnowJobs(searchTerm) {
  const data = await fetchWithTimeout(
    "https://www.arbeitnow.com/api/job-board-api"
  );

  const search = searchTerm.toLowerCase();

  return (data.data || [])
    .filter(job => {
      if (!search) return true;

      const content = [
        job.title,
        job.description,
        ...(job.tags || [])
      ].join(" ").toLowerCase();

      return search.split(/\s+/).some(word =>
        word.length > 2 && content.includes(word)
      );
    })
    .map(job => ({
      id: `arbeitnow-${job.slug || job.url}`,
      title: job.title,
      company: job.company_name,
      location: job.location || "Not specified",
      type: job.job_types?.join(", ") || "Not specified",
      description: job.description || "",
      tags: job.tags || [],
      applyUrl: job.url,
      source: "Arbeitnow",
      publishedAt: job.created_at || null
    }));
}

async function discoverJobs(searchTerm) {
  const results = await Promise.allSettled([
    getRemotiveJobs(searchTerm),
    getArbeitnowJobs(searchTerm)
  ]);

  const jobs = [];
  const sources = [];

  results.forEach((result, index) => {
    const sourceName = index === 0 ? "Remotive" : "Arbeitnow";

    if (result.status === "fulfilled") {
      jobs.push(...result.value);

      sources.push({
        name: sourceName,
        status: "available",
        count: result.value.length
      });
    } else {
      console.error(
        `${sourceName} discovery error:`,
        result.reason.message
      );

      sources.push({
        name: sourceName,
        status: "unavailable",
        message: "This source could not be reached."
      });
    }
  });

  const uniqueJobs = [
    ...new Map(jobs.map(job => [job.id, job])).values()
  ];

  const enrichedJobs = uniqueJobs.map(job => ({
    ...job,
    ...detectApplicationMethod(job)
  }));

  return {
    jobs: enrichedJobs,
    sources
  };
}

// Live job search endpoint.
router.get("/jobs", async (req, res) => {
  try {
    const searchTerm = String(
      req.query.search || "developer"
    ).slice(0, 100);

    const { jobs, sources } = await discoverJobs(searchTerm);

    return res.json({
      success: true,
      searchTerm,
      total: jobs.length,
      jobs,
      sources,
      notice:
        "Listings are retrieved from external job boards. Check the original employer page for current availability and eligibility. VOXERA has not submitted any applications."
    });
  } catch (error) {
    console.error("Job discovery error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Live job discovery is temporarily unavailable."
    });
  }
});

// Prepare a tailored application package.
router.post("/application/prepare", (req, res) => {
  try {
    const { job, applicant } = req.body || {};

    if (!job || typeof job !== "object" ||
        !applicant || typeof applicant !== "object") {
      return res.status(400).json({
        success: false,
        message: "Job and applicant details are required."
      });
    }

    const name = cleanText(applicant.name, 150);
    const email = cleanText(applicant.email, 200);

    if (!name || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Provide the applicant's name and a valid email address."
      });
    }

    const applicationPackage = prepareApplication(job, {
      ...applicant,
      name,
      email
    });

    return res.status(200).json(applicationPackage);
  } catch (error) {
    console.error("Application preparation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not prepare the application package."
    });
  }
});

// Resume analysis and matching endpoint.
router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Choose a PDF or DOCX resume first."
      });
    }

    let extracted = "";

    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(req.file.buffer);
      extracted = parsed.text || "";
    } else {
      const parsed = await mammoth.extractRawText({
        buffer: req.file.buffer
      });

      extracted = parsed.value || "";
    }

    if (extracted.trim().length < 40) {
      return res.status(422).json({
        success: false,
        message:
          "Not enough readable text was found. Try a text-based PDF or DOCX."
      });
    }

    const profile = extractProfile(extracted);
    const sessionId = String(req.body.sessionId || "").trim();

if (!sessionId) {
  return res.status(400).json({
    success: false,
    message: "Chat session ID is required."
  });
}

saveResumeContext(
  sessionId,
  JSON.stringify({
    profile,
    resumeText: extracted
  })
);

    const searchTerm = [
      ...profile.skills.slice(0, 5),
      "developer"
    ].join(" ");

    const { jobs, sources } = await discoverJobs(searchTerm);

    const matches = jobs
      .map(job => calculateMatch(job, profile))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 30);

    return res.json({
      success: true,
      fileName: req.file.originalname,
      profile,
      matches,
      sources,
      notice:
        "Match scores are indicative keyword overlap, not an employer assessment. Verify each vacancy on its original application page. No application has been submitted."
    });
  } catch (error) {
    console.error("Resume analysis error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Resume analysis or live job discovery failed."
    });
  }
});

module.exports = router;
