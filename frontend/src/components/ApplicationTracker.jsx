
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  RefreshCw,
  Clock3,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

const API_URL = `http://${window.location.hostname}:5000`;

const statuses = [
  "prepared",
  "reviewed",
  "portal_opened",
  "submitted",
  "interview",
  "rejected",
  "offer_received",
];

const statusLabels = {
  prepared: "Prepared",
  reviewed: "Reviewed",
  portal_opened: "Portal opened",
  submitted: "Submitted",
  interview: "Interview",
  rejected: "Rejected",
  offer_received: "Offer received",
};

const statusColors = {
  prepared: "#b9a6ff",
  reviewed: "#82c8e9",
  portal_opened: "#d6b2ff",
  submitted: "#8ee0bf",
  interview: "#f0cf88",
  rejected: "#f29aa9",
  offer_received: "#91e3b3",
};

const panelStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "15px",
  padding: "17px",
};

function ApplicationTracker({ onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/applications`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not load applications."
        );
      }

      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the tracker.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function updateStatus(application, nextStatus) {
    if (!application?.id || updatingId) return;

    if (
      nextStatus === "submitted" &&
      !window.confirm(
        "Have you personally completed and submitted this application on the employer's official portal?"
      )
    ) {
      return;
    }

    setUpdatingId(application.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/applications/${application.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
            confirmed: nextStatus === "submitted",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not update application status."
        );
      }

      await loadApplications();
    } catch (err) {
      setError(err.message || "Status update failed.");
    } finally {
      setUpdatingId("");
    }
  }

  const formatDate = (value) => {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not recorded";

    return date.toLocaleString();
  };

  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginTop: "22px",
        padding: "clamp(17px, 3vw, 28px)",
        borderRadius: "22px",
        border: "1px solid rgba(170,147,255,0.25)",
        background:
          "linear-gradient(145deg, rgba(31,25,59,0.96), rgba(11,15,34,0.98))",
        boxShadow: "0 20px 65px rgba(0,0,0,0.25)",
        color: "#eee8ff",
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
        Back to VOXERA
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
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

          <h2 style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "8px 0 5px" }}>
            Application tracker
          </h2>

          <p style={{ color: "#aaa3c4", fontSize: "12px", margin: 0 }}>
            Every opportunity, organised in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApplications}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "9px 12px",
            borderRadius: "9px",
            border: "1px solid rgba(174,151,255,0.25)",
            background: "rgba(130,105,215,0.12)",
            color: "#ded4ff",
            cursor: loading ? "wait" : "pointer",
            fontSize: "11px",
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
          gap: "10px",
          margin: "22px 0",
        }}
      >
        <div style={panelStyle}>
          <BriefcaseBusiness size={17} color="#bba8ff" />
          <h3 style={{ fontSize: "23px", margin: "10px 0 3px" }}>
            {applications.length}
          </h3>
          <p style={{ color: "#aaa3c4", fontSize: "10px", margin: 0 }}>
            Total tracked
          </p>
        </div>

        <div style={panelStyle}>
          <Clock3 size={17} color="#82c8e9" />
          <h3 style={{ fontSize: "23px", margin: "10px 0 3px" }}>
            {applications.filter((item) =>
              ["prepared", "reviewed", "portal_opened"].includes(item.status)
            ).length}
          </h3>
          <p style={{ color: "#aaa3c4", fontSize: "10px", margin: 0 }}>
            In progress
          </p>
        </div>

        <div style={panelStyle}>
          <CheckCircle2 size={17} color="#8ee0bf" />
          <h3 style={{ fontSize: "23px", margin: "10px 0 3px" }}>
            {applications.filter((item) =>
              ["submitted", "interview", "offer_received"].includes(item.status)
            ).length}
          </h3>
          <p style={{ color: "#aaa3c4", fontSize: "10px", margin: 0 }}>
            Submitted or beyond
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px",
            marginBottom: "14px",
            borderRadius: "10px",
            color: "#ffc2ca",
            background: "rgba(210,70,95,0.12)",
            fontSize: "11px",
          }}
        >
          <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: "7px" }} />
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#aaa3c4", fontSize: "12px" }}>
          Loading your applications...
        </p>
      ) : applications.length === 0 ? (
        <div
          style={{
            ...panelStyle,
            textAlign: "center",
            padding: "38px 18px",
          }}
        >
          <BriefcaseBusiness size={30} color="#a99ad8" />
          <h3 style={{ fontSize: "15px", margin: "13px 0 6px" }}>
            Your tracker is ready
          </h3>
          <p style={{ color: "#aaa3c4", fontSize: "11px", lineHeight: 1.7 }}>
            Applications you save from the Application Workspace will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "13px" }}>
          {applications.map((application) => (
            <article
              key={application.id}
              style={{
                ...panelStyle,
                padding: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "14px", margin: "0 0 6px" }}>
                    {application.job?.title || "Untitled position"}
                  </h3>

                  <p style={{ color: "#aaa3c4", fontSize: "11px", margin: 0 }}>
                    {application.job?.company || "Company not specified"}
                    {application.job?.location
                      ? ` · ${application.job.location}`
                      : ""}
                  </p>
                </div>

                <span
                  style={{
                    color: statusColors[application.status] || "#d8caff",
                    background: "rgba(130,105,215,0.12)",
                    border: "1px solid rgba(170,147,255,0.2)",
                    padding: "7px 10px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <CircleDot size={11} style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  {statusLabels[application.status] || application.status}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                  color: "#aaa3c4",
                  fontSize: "10px",
                }}
              >
                <span>
                  <CalendarDays size={12} style={{ verticalAlign: "middle", marginRight: "5px" }} />
                  Saved: {formatDate(application.createdAt)}
                </span>

                <span>
                  Updated: {formatDate(application.updatedAt)}
                </span>
              </div>

              {application.officialApplyUrl && (
                <a
                  href={application.officialApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#cbbaff",
                    fontSize: "11px",
                    marginTop: "13px",
                    textDecoration: "none",
                  }}
                >
                  Open official portal <ExternalLink size={12} />
                </a>
              )}

              <div style={{ marginTop: "17px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#aaa3c4",
                    fontSize: "10px",
                    marginBottom: "7px",
                  }}
                >
                  Update application status
                </label>

                <select
                  value={application.status}
                  disabled={updatingId === application.id}
                  onChange={(event) =>
                    updateStatus(application, event.target.value)
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px",
                    borderRadius: "9px",
                    border: "1px solid rgba(190,176,230,0.2)",
                    background: "#17152b",
                    color: "#eee8ff",
                    fontSize: "11px",
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>

                {updatingId === application.id && (
                  <p style={{ color: "#bba8ff", fontSize: "10px" }}>
                    Updating status...
                  </p>
                )}
              </div>

              {Array.isArray(application.statusHistory) &&
                application.statusHistory.length > 0 && (
                  <details style={{ marginTop: "15px" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#cbbaff",
                        fontSize: "11px",
                      }}
                    >
                      View status history ({application.statusHistory.length})
                    </summary>

                    <div
                      style={{
                        marginTop: "12px",
                        paddingLeft: "13px",
                        borderLeft: "1px solid rgba(174,151,255,0.25)",
                      }}
                    >
                      {application.statusHistory.map((entry, index) => (
                        <div key={`${entry.status}-${index}`} style={{ marginBottom: "12px" }}>
                          <p style={{ color: "#e5dcff", fontSize: "11px", margin: 0 }}>
                            {statusLabels[entry.status] || entry.status}
                          </p>
                          <p style={{ color: "#928ba9", fontSize: "10px", margin: "4px 0 0" }}>
                            {formatDate(entry.date || entry.updatedAt || entry.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ApplicationTracker;
