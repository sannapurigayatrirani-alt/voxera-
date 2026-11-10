
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIRECTORY = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIRECTORY, "applications.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readApplications() {
  ensureStorage();

  try {
    const content = fs.readFileSync(DATA_FILE, "utf8");
    const applications = JSON.parse(content);

    return Array.isArray(applications) ? applications : [];
  } catch (error) {
    console.error("Application storage read error:", error.message);
    throw new Error("Could not read application records.");
  }
}

function writeApplications(applications) {
  ensureStorage();

  const temporaryFile = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(applications, null, 2),
    "utf8"
  );

  fs.renameSync(temporaryFile, DATA_FILE);
}

function createApplication(data) {
  const applications = readApplications();

  const application = {
    id: crypto.randomUUID(),
    status: "prepared",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  };

  applications.push(application);
  writeApplications(applications);

  return application;
}

module.exports = {
  readApplications,
  writeApplications,
  createApplication
};
