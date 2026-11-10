
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Workflow,
  Copy,
  Sparkles,
} from "lucide-react";

const panel = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "15px",
  padding: "18px",
};

const muted = {
  color: "#aaa3c4",
  fontSize: "12px",
  lineHeight: 1.7,
};

function ApplicationWorkspace({
  job,
  preparedApplication,
  applicant,
  applicationDraft,
  applicationStatus,
  onBack,
  onOpenPortal,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [copiedField, setCopiedField] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const application = preparedApplication?.application || {};
  const profile = preparedApplication?.profileSummary || {};

  const steps = [
    { label: "Personal details", icon: UserRound },
    { label: "Education", icon: GraduationCap },
    { label: "Experience", icon: BriefcaseBusiness },
    { label: "Resume", icon: FileText },
    { label: "Final review", icon: ShieldCheck },
  ];

  const details = useMemo(
    () => [
      {
        label: "Full name",
        value: applicant?.name || "Not provided",
        icon: UserRound,
      },
      {
        label: "Email address",
        value: applicant?.email || "Not provided",
        icon: Mail,
      },
      {
        label: "Phone number",
        value: applicant?.phone || "Not provided",
        icon: Phone,
      },
    ],
    [applicant]
  );

  const education = Array.isArray(applicant?.education)
    ? applicant.education
    : [];

  const experience = Array.isArray(applicant?.experience)
    ? applicant.experience
    : [];

  const skills = Array.isArray(applicant?.skills)
    ? applicant.skills
    : [];

  const projects = Array.isArray(applicant?.projects)
    ? applicant.projects
    : [];

  const copyText = async (value, label) => {
    if (!value || value === "Not provided") return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(""), 1800);
    } catch {
      setCopiedField("");
      window.prompt("Copy this information:", String(value));
    }
  };

  const copyAll = async () => {
    await copyText(applicationDraft, "complete");
  };

  const applicationMethod = application.method || "manual";

  const statusLabel = String(applicationStatus || "awaiting_review")
    .replaceAll("_", " ")
    .toUpperCase();

  const renderCopyButton = (value, label) => (
    <button
      type="button"
      onClick={() => copyText(value, label)}
      disabled={!value || value === "Not provided"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 10px",
        borderRadius: "8px",
        border: "1px solid rgba(174,151,255,0.25)",
        background: "rgba(130,105,215,0.12)",
        color: "#ded4ff",
        fontSize: "10px",
        cursor: "pointer",
      }}
    >
      {copiedField === label ? <Check size={13} /> : <Copy size={13} />}
      {copiedField === label ? "Copied" : "Copy"}
    </button>
  );

  const sectionTitle = (Icon, title, description) => (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#e9e2ff",
          fontSize: "14px",
          fontWeight: 650,
        }}
      >
        <Icon size={18} color="#bba8ff" />
        {title}
      </div>
      {description && <p style={{ ...muted, margin: "7px 0 0" }}>{description}</p>}
    </div>
  );

  return (
    <section
      style={{
        width: "100%",
        marginTop: "22px",
        padding: "clamp(17px, 3vw, 28px)",
        borderRadius: "22px",
        border: "1px solid rgba(170,147,255,0.25)",
        background:
          "linear-gradient(145deg, rgba(31,25,59,0.96), rgba(11,15,34,0.98))",
        boxShadow: "0 20px 65px rgba(0,0,0,0.25)",
        color: "#eee8ff",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          border: "none",
          background: "transparent",
          color: "#b9addd",
          cursor: "pointer",
          fontSize: "11px",
          padding: "0 0 18px",
        }}
      >
        <ArrowLeft size={15} />
        Back to resume intelligence
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              color: "#ad9adf",
              fontSize: "10px",
              letterSpacing: "2px",
            }}
          >
            VOXERA · CAREER INTELLIGENCE
          </span>
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 30px)",
              margin: "8px 0 5px",
            }}
          >
            Application workspace
          </h2>
          <p style={{ ...muted, margin: 0 }}>
            Your application, organised in one place.
          </p>
        </div>

        <div
          style={{
            padding: "8px 11px",
            borderRadius: "20px",
            color: "#d8caff",
            background: "rgba(130,105,215,0.14)",
            border: "1px solid rgba(170,147,255,0.22)",
            fontSize: "10px",
          }}
        >
          <Sparkles size={12} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          PREPARED FOR REVIEW
        </div>
      </div>

      <div
        style={{
          ...panel,
          marginTop: "22px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "43px",
            height: "43px",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "12px",
            background: "rgba(132,107,220,0.18)",
            color: "#d2c2ff",
          }}
        >
          <BriefcaseBusiness size={21} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "14px" }}>
            {job?.title || "Selected position"}
          </h3>
          <p style={{ ...muted, margin: "5px 0 0" }}>
            {job?.company || "Company not specified"}
            {job?.location ? ` · ${job.location}` : ""}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: "8px",
          margin: "20px 0",
        }}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const selected = activeStep === index;
          const completed = index < activeStep;

          return (
            <button
              type="button"
              key={step.label}
              onClick={() => setActiveStep(index)}
              style={{
                minWidth: 0,
                padding: "12px 9px",
                borderRadius: "11px",
                border: selected
                  ? "1px solid rgba(180,155,255,0.55)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: selected
                  ? "rgba(130,105,215,0.19)"
                  : "rgba(255,255,255,0.025)",
                color: completed || selected ? "#e4d9ff" : "#9991b4",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {completed ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                <span style={{ fontSize: "10px", fontWeight: 600 }}>
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={panel}>
        {activeStep === 0 && (
          <>
            {sectionTitle(
              UserRound,
              "Personal details",
              "Copy the verified information into the employer's form."
            )}

            <div style={{ display: "grid", gap: "10px" }}>
              {details.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.035)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...muted, fontSize: "10px" }}>
                        <Icon size={12} style={{ verticalAlign: "middle", marginRight: "5px" }} />
                        {item.label}
                      </div>
                      <div
                        style={{
                          color: "#eee8ff",
                          fontSize: "12px",
                          marginTop: "5px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                    {renderCopyButton(item.value, item.label)}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeStep === 1 && (
          <>
            {sectionTitle(
              GraduationCap,
              "Education",
              "Education information detected from your resume."
            )}
            {education.length ? (
              education.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    marginBottom: "9px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.035)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <p style={{ ...muted, color: "#e1d9f5", margin: 0 }}>
                    {item}
                  </p>
                  {renderCopyButton(item, `education-${index}`)}
                </div>
              ))
            ) : (
              <p style={muted}>No education details were detected. Review your resume and enter them directly on the employer's form.</p>
            )}
          </>
        )}

        {activeStep === 2 && (
          <>
            {sectionTitle(
              BriefcaseBusiness,
              "Experience and projects",
              "Only include details that accurately represent your background."
            )}

            <h4 style={{ color: "#d9ceff", fontSize: "12px" }}>Experience</h4>
            {experience.length ? experience.map((item, index) => (
              <div key={index} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ ...muted, color: "#ded6f2", margin: 0 }}>{item}</p>
                <div style={{ marginTop: "7px" }}>
                  {renderCopyButton(item, `experience-${index}`)}
                </div>
              </div>
            )) : <p style={muted}>No experience details detected.</p>}

            <h4 style={{ color: "#d9ceff", fontSize: "12px", marginTop: "20px" }}>Projects</h4>
            {projects.length ? projects.map((item, index) => (
              <div key={index} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ ...muted, color: "#ded6f2", margin: 0 }}>{item}</p>
                <div style={{ marginTop: "7px" }}>
                  {renderCopyButton(item, `project-${index}`)}
                </div>
              </div>
            )) : <p style={muted}>No project details detected.</p>}
          </>
        )}

        {activeStep === 3 && (
          <>
            {sectionTitle(
              FileText,
              "Resume",
              "Your uploaded resume is the source document for this application."
            )}
            <div style={{ padding: "14px", borderRadius: "11px", background: "rgba(91,170,142,0.08)", border: "1px solid rgba(117,211,174,0.2)" }}>
              <CheckCircle2 size={17} color="#9de2c4" />
              <p style={{ color: "#c7f0dc", fontSize: "12px", margin: "8px 0 4px" }}>
                Resume analysis completed
              </p>
              <p style={muted}>
                VOXERA has used the extracted profile information to prepare this draft. You must upload the original resume file to the employer's portal yourself.
              </p>
            </div>

            {skills.length > 0 && (
              <>
                <h4 style={{ color: "#d9ceff", fontSize: "12px", marginTop: "18px" }}>
                  Detected skills
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {skills.map((skill, index) => (
                    <span key={`${skill}-${index}`} style={{ padding: "6px 9px", borderRadius: "20px", background: "rgba(130,105,215,0.15)", color: "#d8ccff", fontSize: "10px" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeStep === 4 && (
          <>
            {sectionTitle(
              ShieldCheck,
              "Final application review",
              "Review the generated application content before visiting the employer's website."
            )}

            <div style={{ marginBottom: "15px" }}>
              <p style={{ ...muted, margin: "0 0 6px" }}>Application method</p>
              <strong style={{ fontSize: "12px", color: "#e7deff" }}>
                {applicationMethod}
              </strong>
            </div>

            {application.recipient && (
              <div style={{ marginBottom: "15px" }}>
                <p style={{ ...muted, margin: "0 0 6px" }}>Recipient</p>
                <strong style={{ fontSize: "12px", color: "#e7deff" }}>
                  {application.recipient}
                </strong>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <p style={{ ...muted, margin: "0 0 7px" }}>Prepared application draft</p>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  padding: "13px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#d7cfea",
                  fontFamily: "inherit",
                  fontSize: "11px",
                  lineHeight: 1.7,
                }}
              >
                {applicationDraft || "No application draft is available."}
              </pre>
              <button
                type="button"
                onClick={copyAll}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 12px",
                  borderRadius: "9px",
                  border: "1px solid rgba(174,151,255,0.25)",
                  background: "rgba(130,105,215,0.12)",
                  color: "#ded4ff",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {copiedField === "complete" ? <Check size={14} /> : <Clipboard size={14} />}
                {copiedField === "complete" ? "Copied" : "Copy complete draft"}
              </button>
            </div>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                color: "#d8d0eb",
                fontSize: "11px",
                lineHeight: 1.7,
                cursor: "pointer",
                padding: "13px",
                borderRadius: "10px",
                background: "rgba(130,105,215,0.09)",
              }}
            >
              <input
                type="checkbox"
                checked={reviewConfirmed}
                onChange={(event) => setReviewConfirmed(event.target.checked)}
                style={{ marginTop: "3px" }}
              />
              I have reviewed the prepared information and confirm that it accurately represents my details.
            </label>

            <button
              type="button"
              disabled={!reviewConfirmed}
              onClick={onOpenPortal}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "9px",
                marginTop: "14px",
                padding: "13px",
                border: "none",
                borderRadius: "10px",
                background: reviewConfirmed
                  ? "linear-gradient(100deg,#3d9e91,#58b8a5)"
                  : "rgba(119,105,157,0.35)",
                color: reviewConfirmed ? "#071b1a" : "#aaa3c4",
                fontWeight: 700,
                fontSize: "12px",
                cursor: reviewConfirmed ? "pointer" : "not-allowed",
              }}
            >
              <ExternalLink size={16} />
              Continue to official application portal
              <ArrowRight size={15} />
            </button>

            <p style={{ ...muted, fontSize: "10px", marginTop: "12px" }}>
              VOXERA prepares and organises your information. You will complete the employer's form, upload your resume, handle any verification and submit it yourself. Opening the portal does not submit an application.
            </p>
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "17px",
        }}
      >
        <span style={{ ...muted, fontSize: "10px" }}>
          Current status: {statusLabel}
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "#d5cbea",
              cursor: activeStep === 0 ? "not-allowed" : "pointer",
              opacity: activeStep === 0 ? 0.4 : 1,
              fontSize: "10px",
            }}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(174,151,255,0.25)",
              background: "rgba(130,105,215,0.15)",
              color: "#e1d7ff",
              cursor: activeStep === steps.length - 1 ? "not-allowed" : "pointer",
              opacity: activeStep === steps.length - 1 ? 0.4 : 1,
              fontSize: "10px",
            }}
          >
            Next
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default ApplicationWorkspace;
