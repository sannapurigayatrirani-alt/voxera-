
import { useEffect, useRef, useState } from "react";
import {
  AudioWaveform,
  BrainCircuit,
  Languages,
  Workflow,
  Mic,
  Send,
  Sparkles,
  ArrowUpRight,
  Orbit,
  Globe2,
  Zap,
  ShieldCheck,
  Network,
  CircleStop,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Upload,
  FileText,
  BriefcaseBusiness,
  ExternalLink,
  ClipboardList,
  Save,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import ApplicationWorkspace from "./components/ApplicationWorkspace";
import ApplicationTracker from "./components/ApplicationTracker";
import "./App.css";

const API_URL = `http://${window.location.hostname}:5000`;

const applicationInputStyle = {
  boxSizing: "border-box",
  minWidth: 0,
  padding: "10px 11px",
  borderRadius: "9px",
  border: "1px solid rgba(190, 176, 230, 0.2)",
  background: "rgba(8, 10, 25, 0.48)",
  color: "#eee8ff",
  outline: "none",
  fontSize: "11px",
};

const capabilities = [
  {
    number: "01",
    title: "Voice Intelligence",
    description: "Natural conversations powered by real-time speech AI.",
    icon: AudioWaveform,
    color: "violet",
  },
  {
    number: "02",
    title: "Multi-Agent AI",
    description: "Multiple intelligent agents working together.",
    icon: BrainCircuit,
    color: "blue",
  },
  {
    number: "03",
    title: "Multilingual AI",
    description: "Communicate naturally across languages.",
    icon: Languages,
    color: "cyan",
  },
  {
    number: "04",
    title: "Smart Workflows",
    description: "Turn intelligent decisions into useful actions.",
    icon: Workflow,
    color: "pink",
  },
];

const possibilities = [
  {
    icon: Network,
    title: "Connected intelligence",
    description: "Bring different AI capabilities into one experience.",
  },
  {
    icon: Globe2,
    title: "Global communication",
    description: "Create conversations without language barriers.",
  },
  {
    icon: ShieldCheck,
    title: "Designed with purpose",
    description: "A thoughtful space for smarter interactions.",
  },
];

const TARGET_SAMPLE_RATE = 16000;
const SAMPLES_PER_FRAME = 512;

// Only accept a valid HTTP/HTTPS application URL.
function getOfficialApplyUrl(job) {
  if (!job) return "";

  const candidate =
    job.applyUrl ||
    job.applicationUrl ||
    job.apply_url ||
    job.links?.apply ||
    "";

  if (typeof candidate !== "string" || !candidate.trim()) {
    return "";
  }

  try {
    const parsed = new URL(candidate);

    if (!["https:", "http:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function CosmicEmblem() {
  return (
    <div className="cosmic-emblem">
      <div className="emblem-orbit orbit-one" />
      <div className="emblem-orbit orbit-two" />
      <div className="emblem-orbit orbit-three" />

      <span className="orbit-point point-one" />
      <span className="orbit-point point-two" />
      <span className="orbit-point point-three" />

      <div className="emblem-core">
        <Orbit size={27} strokeWidth={1.5} />
      </div>
    </div>
  );
}

function IntelligenceOrb() {
  return (
    <div className="assistant-orb">
      <div className="orb-ring ring-one" />
      <div className="orb-ring ring-two" />
      <div className="orb-ring ring-three" />

      <span className="orb-dot orb-dot-one" />
      <span className="orb-dot orb-dot-two" />

      <div className="orb-center">
        <AudioWaveform size={28} strokeWidth={1.6} />
      </div>
    </div>
  );
}

function CapabilityCard({ item }) {
  const Icon = item.icon;

  return (
    <article className={`capability-card ${item.color}`}>
      <div className="card-top">
        <div className="capability-icon">
          <Icon size={22} strokeWidth={1.7} />
        </div>

        <span className="card-number">{item.number}</span>
      </div>

      <div className="card-content">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>

      <ArrowUpRight className="card-arrow" size={17} />
    </article>
  );
}

function resampleAudio(input, inputRate) {
  if (inputRate === TARGET_SAMPLE_RATE) {
    return input;
  }

  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = position - left;

    output[i] =
      input[left] * (1 - fraction) +
      input[right] * fraction;
  }

  return output;
}

function encodePCM(samples) {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));

    const value =
      sample < 0
        ? sample * 0x8000
        : sample * 0x7fff;

    view.setInt16(i * 2, value, true);
  }

  return buffer;
}

function App() {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState("Ready to connect");

  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [chatMessages, setChatMessages] = useState([]);
  const [pendingSummary, setPendingSummary] = useState(null);
  const [pendingIntent, setPendingIntent] = useState(null);

  // Resume Intelligence state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const resumeInputRef = useRef(null);

  // Application preparation state
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applicationPhone, setApplicationPhone] = useState("");
  const [applicationNote, setApplicationNote] = useState("");
  const [applicationDraft, setApplicationDraft] = useState("");

  // Backend-generated application state
  const [preparedApplication, setPreparedApplication] = useState(null);
  const [applicationPreparing, setApplicationPreparing] = useState(false);
  const [applicationPrepareError, setApplicationPrepareError] =
    useState("");

  // Application approval and portal status
  const [applicationApproved, setApplicationApproved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("draft");

  // Dedicated application workspace
  const [showApplicationWorkspace, setShowApplicationWorkspace] =
    useState(false);

  // Application Tracker state
  const [showApplicationTracker, setShowApplicationTracker] =
    useState(false);
  const [trackerSaving, setTrackerSaving] = useState(false);
  const [trackerSaved, setTrackerSaved] = useState(false);
  const [trackerSaveError, setTrackerSaveError] = useState("");
  const [trackedApplicationId, setTrackedApplicationId] = useState("");

  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const gainRef = useRef(null);

  const readyRef = useRef(false);
  const pendingSamplesRef = useRef(new Float32Array(0));
  const stopTimerRef = useRef(null);
  const mountedRef = useRef(false);

  const transcriptBufferRef = useRef("");
  const seenSegmentIdsRef = useRef(new Set());
  const partialTranscriptRef = useRef("");
  const sessionIdRef = useRef(null);

  if (!sessionIdRef.current) {
    sessionIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `voxera-${Date.now()}-${Math.random()}`;
  }

  // ------------------------------
  // CHAT MESSAGE HANDLING
  // ------------------------------

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? message).trim();

    if (!text || isSending) return;

    setErrorMessage("");
    setMessage("");

    setChatMessages((previous) => [
      ...previous.slice(-39),
      { role: "user", text },
    ]);

    setIsSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/assistant/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message: text,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "VOXERA could not process your request.";

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Keep the default error message.
        }

        throw new Error(errorMessage);
      }

      const contentType =
        response.headers.get("content-type") || "";

     if (contentType.includes("application/json")) {
  const data = await response.json();

  console.log(
    "VOXERA PORTAL URL:",
    data.organizationPlan?.portalSearchUrl
  );

  setChatMessages((previous) => [
    ...previous.slice(-39),
    {
      role: "assistant",
      text:
        data.reply ||
        data.message ||
        "Your request has been processed.",
      summary: data.summary || null,
      portalSearchUrl:
        data.organizationPlan?.portalSearchUrl || null,
      portalSearchType:
        data.organizationPlan?.portalSearchType || null,
    },
  ]);

  if (data.status === "awaiting_confirmation") {
    setPendingSummary(data.summary || null);
    setPendingIntent(data.intent || null);
  }

  return;
}
      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this response."
        );
      }

      setChatMessages((previous) => [
        ...previous.slice(-39),
        { role: "assistant", text: "" },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullReply = "";
      let pendingUpdate = "";
      let lastUpdate = 0;

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        pendingUpdate += decoder.decode(value, {
          stream: true,
        });

        const now = Date.now();

        if (now - lastUpdate >= 50) {
          fullReply += pendingUpdate;
          pendingUpdate = "";
          lastUpdate = now;

          const currentReply = fullReply;

          setChatMessages((previous) => {
            const updated = [...previous];
            const lastMessage =
              updated[updated.length - 1];

            if (lastMessage?.role === "assistant") {
              updated[updated.length - 1] = {
                ...lastMessage,
                text: currentReply,
              };
            }

            return updated;
          });
        }
      }

      pendingUpdate += decoder.decode();

      if (pendingUpdate) {
        fullReply += pendingUpdate;
      }

      
setChatMessages((previous) => [
  ...previous.slice(-39),
  {
    role: "assistant",
    text: fullReply,
  },
]);
    } catch (error) {
      console.error("VOXERA chat error:", error);

      setErrorMessage(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  // ------------------------------
  // CONFIRM / CANCEL REQUEST
  // ------------------------------

  async function handleConfirmation(approved) {
    if (isSending) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/assistant/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            approved,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not process your confirmation."
        );
      }

      setChatMessages((previous) => [
        ...previous.slice(-39),
        {
          role: "assistant",
          text: data.reply,
        },
      ]);

      setPendingSummary(null);
      setPendingIntent(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }

  // ------------------------------
  // RESUME ANALYSIS
  // ------------------------------

  async function handleResumeAnalyze() {
    if (!resumeFile || resumeLoading) {
      setResumeError("Please select your resume first.");
      return;
    }

    setResumeLoading(true);
    setResumeError("");
    setResumeResult(null);
    setSelectedJobId("");
    setApplicationDraft("");
    setPreparedApplication(null);
    setApplicationPrepareError("");
    setApplicationApproved(false);
    setApplicationStatus("draft");
    setShowApplicationWorkspace(false);

    setTrackerSaved(false);
    setTrackerSaveError("");
    setTrackedApplicationId("");

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("sessionId", sessionIdRef.current);

      const response = await fetch(
        `${API_URL}/api/resume/analyze`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Resume analysis failed."
        );
      }

      setResumeResult(data);
    } catch (error) {
      setResumeError(error.message);
    } finally {
      setResumeLoading(false);
    }
  }

  // ------------------------------
  // APPLICATION PREPARATION
  // ------------------------------

  async function handlePrepareApplication(job) {
    if (!job || applicationPreparing) return;

    if (!applicationName.trim() || !applicationEmail.trim()) {
      setApplicationPrepareError(
        "Please enter your name and email address before preparing your application."
      );
      return;
    }

    setApplicationPreparing(true);
    setApplicationPrepareError("");
    setPreparedApplication(null);
    setApplicationDraft("");
    setApplicationApproved(false);
    setApplicationStatus("preparing");
    setShowApplicationWorkspace(false);

    setTrackerSaved(false);
    setTrackerSaveError("");
    setTrackedApplicationId("");

    try {
      const officialUrl = getOfficialApplyUrl(job);

      const response = await fetch(
        `${API_URL}/api/resume/application/prepare`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job: {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              applicationMethod: job.applicationMethod,
              applicationEmail: job.applicationEmail,
              applicationUrl: officialUrl,
              applyUrl: officialUrl,
              description: job.description,
            },
            applicant: {
              name: applicationName.trim(),
              email: applicationEmail.trim(),
              phone: applicationPhone.trim(),
              skills: resumeResult?.profile?.skills || [],
              education: resumeResult?.profile?.education || [],
              experience: resumeResult?.profile?.experience || [],
              projects: resumeResult?.profile?.projects || [],
              message: applicationNote.trim(),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not prepare your application."
        );
      }

      setPreparedApplication(data);

      const application = data.application || {};

      const draft = [
        `APPLICATION PREVIEW — ${job.title}`,
        `Company: ${job.company}`,
        `Location: ${job.location}`,
        "",
        `Name: ${applicationName.trim()}`,
        `Email: ${applicationEmail.trim()}`,
        `Phone: ${applicationPhone.trim() || "Not provided"}`,
        "",
        `Application method: ${application.method || "manual"}`,
        "",
        "COVER LETTER",
        application.coverLetter || "No cover letter was generated.",
        "",
        ...(application.emailBody
          ? ["EMAIL DRAFT", application.emailBody, ""]
          : []),
        ...(application.instructions
          ? [
              "APPLICATION INSTRUCTIONS",
              application.instructions,
              "",
            ]
          : []),
      ].join("\n");

      setApplicationDraft(draft);
      setApplicationStatus("awaiting_review");

      // Open the dedicated workspace after preparation succeeds.
      setShowApplicationWorkspace(true);
    } catch (error) {
      console.error("Application preparation error:", error);

      setApplicationPrepareError(
        error.message || "Application preparation failed."
      );

      setApplicationStatus("draft");
      setShowApplicationWorkspace(false);
    } finally {
      setApplicationPreparing(false);
    }
  }

  // Find the currently selected job and its official application URL.
  const selectedApplicationJob =
    resumeResult?.matches?.find(
      (job) => job.id === selectedJobId
    ) || null;

  const officialApplyUrl =
    getOfficialApplyUrl(selectedApplicationJob);

  // ------------------------------
  // SAVE APPLICATION TO TRACKER
  // ------------------------------

  async function handleSaveApplicationToTracker() {
    if (trackerSaving || trackerSaved) return;

    if (!selectedApplicationJob || !preparedApplication) {
      setTrackerSaveError(
        "Prepare an application preview before saving it to your tracker."
      );
      return;
    }

    if (!applicationName.trim() || !applicationEmail.trim()) {
      setTrackerSaveError(
        "Your name and email are required to save this application."
      );
      return;
    }

    setTrackerSaving(true);
    setTrackerSaveError("");

    try {
      const response = await fetch(
        `${API_URL}/api/applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job: {
              id: selectedApplicationJob.id,
              title: selectedApplicationJob.title,
              company: selectedApplicationJob.company,
              location: selectedApplicationJob.location,
              source:
                selectedApplicationJob.source ||
                selectedApplicationJob.url ||
                "",
            },
            applicant: {
              name: applicationName.trim(),
              email: applicationEmail.trim(),
              phone: applicationPhone.trim(),
            },
            applicationDraft,
            officialApplyUrl,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Handle a non-JSON response below.
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "VOXERA could not save this application to your tracker."
        );
      }

      const savedRecord =
        data.application ||
        data.data ||
        data.record ||
        {};

      setTrackedApplicationId(
        savedRecord.id || savedRecord._id || ""
      );

      setTrackerSaved(true);
      setTrackerSaveError("");
    } catch (error) {
      console.error("Application tracker save error:", error);

      setTrackerSaveError(
        error.message ||
          "Could not save this application. Please try again."
      );
    } finally {
      setTrackerSaving(false);
    }
  }

  // ------------------------------
  // OPEN OFFICIAL APPLICATION PORTAL
  // ------------------------------

  function handleOpenApplicationPortal() {
    if (!officialApplyUrl) {
      window.alert(
        "A valid official application portal URL is not available for this job. Please verify the employer's official application page."
      );
      return;
    }

    // This opens the employer's portal only.
    // It does not submit an application.
    window.open(
      officialApplyUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setApplicationApproved(true);
    setApplicationStatus("portal_opened");
  }

  // ------------------------------
  // AUDIO CLEANUP
  // ------------------------------

  function releaseAudio() {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;

      try {
        processorRef.current.disconnect();
      } catch {
        // Already disconnected.
      }

      processorRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
    } catch {
      // Already disconnected.
    }

    sourceRef.current = null;

    try {
      gainRef.current?.disconnect();
    } catch {
      // Already disconnected.
    }

    gainRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      if (context.state !== "closed") {
        context.close().catch(() => {});
      }
    }
  }

  // ------------------------------
  // STOP RECORDING
  // ------------------------------

  function finishRecording() {
    readyRef.current = false;
    setIsRecording(false);

    const socket = socketRef.current;

    if (
      socket?.readyState === WebSocket.OPEN &&
      pendingSamplesRef.current.length > 0
    ) {
      try {
        const remaining = pendingSamplesRef.current;
        const finalFrame = new Float32Array(SAMPLES_PER_FRAME);

        finalFrame.set(
          remaining.slice(0, SAMPLES_PER_FRAME)
        );

        socket.send(encodePCM(finalFrame));
      } catch (error) {
        console.error("Could not send final audio frame:", error);
      }
    }

    pendingSamplesRef.current = new Float32Array(0);

    releaseAudio();

    if (socket?.readyState === WebSocket.OPEN) {
      setConnectionStatus("Finishing transcription...");

      try {
        socket.send(JSON.stringify({ type: "commit" }));
      } catch {
        setConnectionStatus("Connection closed");
      }

      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      stopTimerRef.current = setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }, 2500);
    } else {
      setConnectionStatus("Ready to connect");
    }
  }

  // ------------------------------
  // START GNANI VOICE RECOGNITION
  // ------------------------------

  async function startRecording() {
    setErrorMessage("");
    setTranscript("");

    transcriptBufferRef.current = "";
    seenSegmentIdsRef.current.clear();
    partialTranscriptRef.current = "";
    pendingSamplesRef.current = new Float32Array(0);

    setConnectionStatus("Requesting microphone access...");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access is unavailable. Use localhost or HTTPS."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error(
          "Your browser does not support Web Audio."
        );
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      await audioContext.resume();

      const source =
        audioContext.createMediaStreamSource(stream);

      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(
        4096,
        1,
        1
      );

      processorRef.current = processor;

      const gain = audioContext.createGain();
      gain.gain.value = 0;
      gainRef.current = gain;

      const socketURL =
        `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:5000/api/voice/stream`;

      setConnectionStatus("Connecting to Gnani AI...");

      const socket = new WebSocket(socketURL);

      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = () => {
        if (mountedRef.current) {
          setConnectionStatus(
            "Connected to backend; waiting for Gnani..."
          );
        }
      };

      socket.onmessage = (event) => {
        let data;

        try {
          if (typeof event.data !== "string") return;
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === "ready") {
          readyRef.current = true;

          if (mountedRef.current) {
            setConnectionStatus("Listening · Gnani connected");
            setIsRecording(true);
          }

          return;
        }

        if (data.type === "error") {
          readyRef.current = false;

          if (mountedRef.current) {
            setErrorMessage(
              data.message ||
                "The voice service returned an error."
            );

            setConnectionStatus("Voice connection error");
            setIsRecording(false);
          }

          releaseAudio();
          return;
        }

        if (data.type === "speech_start") {
          partialTranscriptRef.current = "";
          return;
        }

        if (
          [
            "transcript",
            "transcription",
            "partial_transcript",
            "final_transcript",
          ].includes(data.type)
        ) {
          const recognizedText =
            data.text ??
            data.transcript ??
            data.result?.text;

          if (
            typeof recognizedText !== "string" ||
            !recognizedText.trim()
          ) {
            return;
          }

          const cleanText = recognizedText.trim();

          const isPartial =
            data.is_final === false ||
            data.type === "partial_transcript";

          const segmentKey =
            data.segment_id ||
            `${data.utterance_id || "unknown"}-${data.segment_index ?? "unknown"}-${cleanText}`;

          if (
            !isPartial &&
            seenSegmentIdsRef.current.has(segmentKey)
          ) {
            return;
          }

          if (isPartial) {
            partialTranscriptRef.current = cleanText;
          } else {
            seenSegmentIdsRef.current.add(segmentKey);

            transcriptBufferRef.current = [
              transcriptBufferRef.current,
              cleanText,
            ]
              .filter(Boolean)
              .join(" ");

            partialTranscriptRef.current = "";
          }

          const completeText = [
            transcriptBufferRef.current,
            partialTranscriptRef.current,
          ]
            .filter(Boolean)
            .join(" ");

          if (mountedRef.current && completeText) {
            setTranscript(completeText);
            setMessage(completeText);
          }
        }
      };

      socket.onerror = () => {
        readyRef.current = false;

        if (mountedRef.current) {
          setErrorMessage(
            "WebSocket connection failed. Check the backend and Gnani logs."
          );

          setConnectionStatus("Connection failed");
          setIsRecording(false);
        }

        releaseAudio();
      };

      socket.onclose = () => {
        readyRef.current = false;

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (mountedRef.current) {
          setIsRecording(false);

          setConnectionStatus((previous) =>
            previous === "Voice connection error" ||
            previous === "Connection failed"
              ? previous
              : "Disconnected"
          );
        }

        releaseAudio();
      };

      source.connect(processor);
      processor.connect(gain);
      gain.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (
          !readyRef.current ||
          socket.readyState !== WebSocket.OPEN
        ) {
          return;
        }

        const input =
          event.inputBuffer.getChannelData(0);

        const converted = resampleAudio(
          input,
          audioContext.sampleRate
        );

        const previous = pendingSamplesRef.current;

        const combined = new Float32Array(
          previous.length + converted.length
        );

        combined.set(previous);
        combined.set(converted, previous.length);

        let offset = 0;

        while (
          offset + SAMPLES_PER_FRAME <= combined.length
        ) {
          const frame = combined.slice(
            offset,
            offset + SAMPLES_PER_FRAME
          );

          socket.send(encodePCM(frame));
          offset += SAMPLES_PER_FRAME;
        }

        pendingSamplesRef.current = combined.slice(offset);
      };
    } catch (error) {
      readyRef.current = false;
      releaseAudio();

      const socket = socketRef.current;
      socketRef.current = null;

      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED &&
        socket.readyState !== WebSocket.CLOSING
      ) {
        socket.close();
      }

      if (mountedRef.current) {
        setIsRecording(false);
        setConnectionStatus("Unable to start microphone");

        setErrorMessage(
          error.message || "Could not start voice recording."
        );
      }
    }
  }

  function handleMicClick() {
    if (isRecording) {
      finishRecording();
    } else {
      startRecording();
    }
  }

  // ------------------------------
  // COMPONENT CLEANUP
  // ------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      readyRef.current = false;

      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      releaseAudio();

      const socket = socketRef.current;
      socketRef.current = null;

      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED &&
        socket.readyState !== WebSocket.CLOSING
      ) {
        socket.close();
      }
    };
  }, []);

  // ------------------------------
  // APPLICATION TRACKER PAGE
  // ------------------------------

  if (showApplicationTracker) {
    return (
      <div className="voxera-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="star-field" />

        <div
          style={{
            width: "min(1100px, 94%)",
            margin: "0 auto",
            padding: "28px 0 50px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <a
              href="#home"
              className="nav-brand"
              onClick={(event) => {
                event.preventDefault();
                setShowApplicationTracker(false);
              }}
              style={{ textDecoration: "none" }}
            >
              <span className="mini-emblem">
                <Orbit size={19} />
              </span>
              <span>VOXERA</span>
            </a>

            <button
              type="button"
              onClick={() => setShowApplicationTracker(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(190, 176, 230, 0.22)",
                background: "rgba(255,255,255,0.045)",
                color: "#e8e0ff",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              <ArrowLeft size={15} />
              Back to workspace
            </button>
          </div>

          <ApplicationTracker />
        </div>
      </div>
    );
  }

  // ------------------------------
  // DEDICATED APPLICATION WORKSPACE
  // ------------------------------

  if (
    showApplicationWorkspace &&
    selectedApplicationJob &&
    preparedApplication
  ) {
    return (
      <div className="voxera-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="star-field" />

        <div
          style={{
            width: "min(1100px, 94%)",
            margin: "0 auto",
            paddingTop: "22px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
              padding: "13px 15px",
              borderRadius: "13px",
              border: "1px solid rgba(164, 143, 255, 0.2)",
              background: "rgba(22, 18, 44, 0.78)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                color: "#e8e0ff",
                fontSize: "12px",
              }}
            >
              <ClipboardList size={17} />
              <span>
                {trackerSaved
                  ? "Application saved to your tracker"
                  : "Application review workspace"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "9px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleSaveApplicationToTracker}
                disabled={trackerSaving || trackerSaved}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "9px",
                  border: "1px solid rgba(177, 155, 255, 0.3)",
                  background: trackerSaved
                    ? "rgba(77, 166, 132, 0.16)"
                    : "rgba(126, 101, 207, 0.2)",
                  color: trackerSaved ? "#b9f0d7" : "#eee8ff",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor:
                    trackerSaving || trackerSaved
                      ? "default"
                      : "pointer",
                  opacity: trackerSaving ? 0.7 : 1,
                }}
              >
                {trackerSaving ? (
                  <LoaderCircle size={15} />
                ) : trackerSaved ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Save size={15} />
                )}

                {trackerSaving
                  ? "Saving..."
                  : trackerSaved
                    ? "Saved to tracker"
                    : "Save to Tracker"}
              </button>

              <button
                type="button"
                onClick={() => setShowApplicationTracker(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "9px",
                  border: "1px solid rgba(190, 176, 230, 0.2)",
                  background: "rgba(255,255,255,0.045)",
                  color: "#e8e0ff",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                <ClipboardList size={15} />
                View Tracker
              </button>
            </div>
          </div>

          {trackerSaveError && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "11px 13px",
                marginBottom: "14px",
                borderRadius: "10px",
                color: "#ffc2ca",
                background: "rgba(210, 70, 95, 0.12)",
                border: "1px solid rgba(255, 120, 145, 0.22)",
                fontSize: "11px",
              }}
            >
              <AlertCircle size={15} />
              {trackerSaveError}
            </div>
          )}

          {trackerSaved && (
            <p
              style={{
                color: "#b9f0d7",
                fontSize: "11px",
                margin: "0 0 14px",
                padding: "0 3px",
              }}
            >
              Your prepared application is now in the tracker. You
              can update its progress there. Saving does not submit
              the application to the employer.
              {trackedApplicationId
                ? ` Reference: ${trackedApplicationId}`
                : ""}
            </p>
          )}
        </div>

        <ApplicationWorkspace
          job={selectedApplicationJob}
          preparedApplication={preparedApplication}
          applicant={{
            name: applicationName,
            email: applicationEmail,
            phone: applicationPhone,
            skills: resumeResult?.profile?.skills || [],
            education: resumeResult?.profile?.education || [],
            experience: resumeResult?.profile?.experience || [],
            projects: resumeResult?.profile?.projects || [],
          }}
          applicationDraft={applicationDraft}
          applicationStatus={applicationStatus}
          officialApplyUrl={officialApplyUrl}
          onBack={() => {
            setShowApplicationWorkspace(false);
          }}
          onOpenPortal={handleOpenApplicationPortal}
        />
      </div>
    );
  }

  // ------------------------------
  // MAIN UI
  // ------------------------------

  return (
    <div className="voxera-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="star-field" />

      {/* Navigation */}
      <header className="topbar">
        <a href="#home" className="nav-brand">
          <span className="mini-emblem">
            <Orbit size={19} />
          </span>
          <span>VOXERA</span>
        </a>

        <div className="nav-status">
          <span className="status-dot" />
          INTELLIGENCE IN MOTION
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => setShowApplicationTracker(true)}
            className="nav-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              border: "1px solid rgba(190, 176, 230, 0.2)",
              background: "rgba(255,255,255,0.045)",
              color: "#e8e0ff",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            <ClipboardList size={15} />
            Application Tracker
          </button>

          <a href="#workspace" className="nav-link">
            Enter workspace
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <main className="main-content" id="home">
        {/* Brand */}
        <section className="brand-section">
          <CosmicEmblem />

          <h1 className="brand-name">VOXERA</h1>

          <p className="brand-tagline">
            A UNIVERSE OF INTELLIGENCE
          </p>

          <div className="brand-divider">
            <span />
            <Sparkles size={13} />
            <span />
          </div>

          <p className="brand-motto">
            Listen. Think. Respond.
          </p>

          <p className="brand-description">
            One voice connecting powerful AI agents, languages,
            and intelligent workflows in one seamless experience.
          </p>
        </section>

        {/* Voice Workspace */}
        <section className="workspace-section" id="workspace">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" />
                YOUR INTELLIGENCE SPACE
              </span>

              <h2>Meet your AI universe.</h2>

              <p>
                One conversation. Endless possibilities.
              </p>
            </div>

            <div className="workspace-icon">
              <Sparkles size={21} />
            </div>
          </div>

          <div className="assistant-panel">
            <div className="panel-glow" />

            <IntelligenceOrb />

            <div className="assistant-label">
              <h3>
                {isRecording
                  ? "I'm listening..."
                  : isSending
                    ? "Processing your request..."
                    : "What shall we explore today?"}
              </h3>

              <p>Your VOXERA intelligence core</p>

              <span
                className={`connection-status ${
                  isRecording ? "is-listening" : ""
                }`}
                aria-live="polite"
              >
                <span className="status-dot" />
                {connectionStatus}
              </span>
            </div>

            {/* Conversation */}
            <div
              className="voxera-conversation"
              aria-live="polite"
              style={{
                width: "100%",
                maxHeight: "340px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "12px",
                marginTop: "16px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {chatMessages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px",
                    color: "#aaa5c4",
                    fontSize: "13px",
                  }}
                >
                  <Sparkles size={17} />
                  <p>
                    Start a conversation. Ask about appointments,
                    school admissions or other tasks.
                  </p>
                </div>
              )}

              {chatMessages.map((item, index) => (
                <div
                  key={`${index}-${item.role}`}
                  style={{
                    alignSelf:
                      item.role === "user"
                        ? "flex-end"
                        : "flex-start",
                    maxWidth: "88%",
                    padding: "13px 16px",
                    borderRadius: "15px",
                    background:
                      item.role === "user"
                        ? "rgba(113, 87, 206, 0.24)"
                        : "rgba(255, 255, 255, 0.055)",
                    border:
                      "1px solid rgba(255,255,255,0.10)",
                    color: "#eeeafc",
                    fontSize: "13px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: "1px",
                      color:
                        item.role === "user"
                          ? "#c6b7ff"
                          : "#9d91ce",
                      marginBottom: "5px",
                    }}
                  >
                    {item.role === "user" ? "YOU" : "VOXERA"}
                  </div>

                  

{item.text}

{item.portalSearchUrl && (
  <a
    href={item.portalSearchUrl}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-block",
      marginTop: "12px",
      color: "#b8a9ed",
      textDecoration: "underline",
      fontSize: "13px",
    }}
  >
    {item.portalSearchType === "admission"
      ? "Search for the official admission portal ↗"
      : "Search for the official appointment portal ↗"}
  </a>
)}


                </div>
              ))}

              {isSending && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    color: "#b8a9ed",
                    fontSize: "12px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    padding: "8px",
                  }}
                >
                  <LoaderCircle size={15} />
                  VOXERA is processing...
                </div>
              )}
            </div>

            {/* Confirmation summary */}
            {pendingSummary && (
              <div
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "16px",
                  background: "rgba(120, 95, 205, 0.10)",
                  border:
                    "1px solid rgba(160, 135, 255, 0.3)",
                  marginTop: "12px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <h4
                  style={{
                    color: "#eee8ff",
                    margin: "0 0 12px",
                    fontSize: "14px",
                  }}
                >
                  <ShieldCheck
                    size={16}
                    style={{
                      display: "inline",
                      marginRight: "8px",
                      verticalAlign: "middle",
                    }}
                  />
                  Review your request
                </h4>

                {pendingSummary.map((detail, index) => (
                  <p
                    key={index}
                    style={{
                      color: "#c9c3df",
                      fontSize: "12px",
                      lineHeight: 1.7,
                      margin: "5px 0",
                    }}
                  >
                    {detail}
                  </p>
                ))}

                <p
                  style={{
                    color: "#a99bce",
                    fontSize: "11px",
                    marginTop: "12px",
                  }}
                >
                  {pendingIntent === "appointment"
                    ? "Approval saves an appointment request. It does not confirm a provider's availability."
                    : "Approval saves an admission enquiry. It does not confirm admission."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "15px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      border: "none",
                      borderRadius: "9px",
                      padding: "10px 15px",
                      background: "#7660c8",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Approve request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmation(false)}
                    disabled={isSending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      border:
                        "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "9px",
                      padding: "10px 15px",
                      background: "transparent",
                      color: "#ddd6f5",
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={15} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Message Composer */}
            <form
              className="message-composer"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                placeholder="Ask anything or start speaking..."
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                aria-label="Enter your message"
                disabled={isSending}
              />

              <button
                type="button"
                className={`mic-action ${
                  isRecording ? "mic-recording" : ""
                }`}
                onClick={handleMicClick}
                aria-label={
                  isRecording
                    ? "Stop voice recording"
                    : "Start voice recording"
                }
                title={
                  isRecording
                    ? "Stop recording"
                    : "Connect microphone to Gnani AI"
                }
              >
                {isRecording ? (
                  <CircleStop size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </button>

              <button
                type="submit"
                className="send-action"
                aria-label="Send message"
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <LoaderCircle size={17} />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </form>

            {errorMessage && (
              <div className="voice-error" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Live Transcript */}
            <div
              className="transcript-panel"
              aria-live="polite"
            >
              <div className="transcript-heading">
                <AudioWaveform size={15} />
                <span>LIVE TRANSCRIPT</span>
              </div>

              <p
                className={
                  transcript
                    ? "transcript-text"
                    : "transcript-empty"
                }
              >
                {transcript ||
                  "Your recognized speech will appear here when Gnani returns a transcript."}
              </p>
            </div>

            <div className="composer-footer">
              <span>
                <Zap size={12} />
                Intelligent conversations
              </span>

              <span>
                <ShieldCheck size={12} />
                One unified experience
              </span>
            </div>
          </div>

          {/* RESUME INTELLIGENCE */}
          <section
            className="resume-intelligence"
            aria-labelledby="resume-heading"
            style={{
              width: "100%",
              marginTop: "28px",
              padding: "clamp(20px, 4vw, 30px)",
              borderRadius: "22px",
              background:
                "linear-gradient(145deg, rgba(31, 25, 59, 0.82), rgba(15, 18, 38, 0.92))",
              border:
                "1px solid rgba(164, 143, 255, 0.22)",
              boxShadow:
                "0 18px 55px rgba(0, 0, 0, 0.18)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "13px",
                    color: "#c9baff",
                    background: "rgba(137, 112, 232, 0.16)",
                    border:
                      "1px solid rgba(177, 155, 255, 0.2)",
                  }}
                >
                  <BriefcaseBusiness size={20} />
                </span>

                <div>
                  <span
                    style={{
                      color: "#a99ad8",
                      fontSize: "10px",
                      letterSpacing: "1.8px",
                    }}
                  >
                    PERSONAL CAREER INTELLIGENCE
                  </span>

                  <h2
                    id="resume-heading"
                    style={{
                      color: "#f2edff",
                      fontSize: "clamp(20px, 3vw, 26px)",
                      margin: "3px 0 0",
                    }}
                  >
                    Resume Intelligence
                  </h2>
                </div>
              </div>

              <p
                style={{
                  color: "#b8b1d1",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  maxWidth: "680px",
                  margin: "12px 0 20px",
                }}
              >
                Upload your resume. VOXERA will extract your
                profile, compare your skills with opportunities,
                and prepare an application preview for you to review.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    padding: "17px",
                    borderRadius: "15px",
                    background: "rgba(255,255,255,0.035)",
                    border:
                      "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      color: "#d9d0ff",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <FileText size={17} />
                    Upload your resume
                  </div>

                  <p
                    style={{
                      color: "#9f98b9",
                      fontSize: "11px",
                      lineHeight: 1.6,
                      margin: "9px 0 14px",
                    }}
                  >
                    PDF or DOCX · Maximum file size 5 MB
                  </p>

                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] || null;

                      setResumeFile(file);
                      setResumeResult(null);
                      setResumeError("");
                      setApplicationDraft("");
                      setPreparedApplication(null);
                      setApplicationPrepareError("");
                      setApplicationApproved(false);
                      setApplicationStatus("draft");
                      setSelectedJobId("");
                      setShowApplicationWorkspace(false);

                      setTrackerSaved(false);
                      setTrackerSaveError("");
                      setTrackedApplicationId("");
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      resumeInputRef.current?.click()
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 13px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(176, 154, 255, 0.35)",
                      background:
                        "rgba(126, 101, 207, 0.13)",
                      color: "#e7dfff",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={15} />
                    Choose PDF / DOCX
                  </button>

                  <div
                    style={{
                      color: resumeFile
                        ? "#d8ccff"
                        : "#8e87a8",
                      fontSize: "11px",
                      marginTop: "10px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {resumeFile
                      ? resumeFile.name
                      : "No resume selected"}
                  </div>

                  <button
                    type="button"
                    onClick={handleResumeAnalyze}
                    disabled={!resumeFile || resumeLoading}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "11px 13px",
                      border: "none",
                      borderRadius: "10px",
                      background:
                        !resumeFile || resumeLoading
                          ? "rgba(119, 105, 157, 0.35)"
                          : "linear-gradient(100deg, #8069d5, #a276d8)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor:
                        !resumeFile || resumeLoading
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {resumeLoading ? (
                      <LoaderCircle size={15} />
                    ) : (
                      <Sparkles size={15} />
                    )}

                    {resumeLoading
                      ? "Analysing resume..."
                      : "Analyse resume"}
                  </button>
                </div>

                <div
                  style={{
                    padding: "17px",
                    borderRadius: "15px",
                    background: "rgba(255,255,255,0.035)",
                    border:
                      "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <div
                    style={{
                      color: "#d9d0ff",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      gap: "9px",
                      alignItems: "center",
                    }}
                  >
                    <BrainCircuit size={17} />
                    What VOXERA analyses
                  </div>

                  <ul
                    style={{
                      color: "#aaa3c4",
                      fontSize: "12px",
                      lineHeight: 2,
                      paddingLeft: "18px",
                      margin: "12px 0 0",
                    }}
                  >
                    <li>Skills detected in your resume</li>
                    <li>Education and experience sections</li>
                    <li>Skill overlap with available roles</li>
                    <li>An application preview for your review</li>
                  </ul>
                </div>
              </div>

              {resumeError && (
                <div
                  role="alert"
                  style={{
                    marginTop: "14px",
                    padding: "11px 13px",
                    borderRadius: "10px",
                    color: "#ffc2ca",
                    background: "rgba(210, 70, 95, 0.12)",
                    border:
                      "1px solid rgba(255, 120, 145, 0.22)",
                    fontSize: "12px",
                  }}
                >
                  {resumeError}
                </div>
              )}

              {resumeResult && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      background: "rgba(91, 170, 142, 0.08)",
                      border:
                        "1px solid rgba(117, 211, 174, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#b7f0d8",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={17} />
                      Resume analysed
                    </div>

                    <p
                      style={{
                        color: "#aaa9bf",
                        fontSize: "11px",
                        margin: "7px 0 0",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {resumeResult.fileName}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: "12px",
                      marginTop: "13px",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        borderRadius: "13px",
                        background: "rgba(255,255,255,0.035)",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <h3
                        style={{
                          color: "#e6ddff",
                          fontSize: "12px",
                          margin: "0 0 11px",
                        }}
                      >
                        Skills detected
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "7px",
                        }}
                      >
                        {resumeResult.profile?.skills?.length ? (
                          resumeResult.profile.skills.map(
                            (skill) => (
                              <span
                                key={skill}
                                style={{
                                  color: "#d7ccff",
                                  background:
                                    "rgba(130, 105, 215, 0.16)",
                                  border:
                                    "1px solid rgba(166, 143, 245, 0.2)",
                                  padding: "5px 8px",
                                  borderRadius: "20px",
                                  fontSize: "10px",
                                }}
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span
                            style={{
                              color: "#9e97b7",
                              fontSize: "11px",
                            }}
                          >
                            No recognised skills found.
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "15px",
                        borderRadius: "13px",
                        background: "rgba(255,255,255,0.035)",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <h3
                        style={{
                          color: "#e6ddff",
                          fontSize: "12px",
                          margin: "0 0 9px",
                        }}
                      >
                        Education
                      </h3>

                      {resumeResult.profile?.education?.length ? (
                        resumeResult.profile.education.map(
                          (item, index) => (
                            <p
                              key={index}
                              style={{
                                color: "#aaa3c4",
                                fontSize: "11px",
                                lineHeight: 1.6,
                                margin: "5px 0",
                              }}
                            >
                              {item}
                            </p>
                          )
                        )
                      ) : (
                        <p
                          style={{
                            color: "#9e97b7",
                            fontSize: "11px",
                          }}
                        >
                          No education lines detected.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "15px",
                        borderRadius: "13px",
                        background: "rgba(255,255,255,0.035)",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <h3
                        style={{
                          color: "#e6ddff",
                          fontSize: "12px",
                          margin: "0 0 9px",
                        }}
                      >
                        Experience
                      </h3>

                      {resumeResult.profile?.experience?.length ? (
                        resumeResult.profile.experience.map(
                          (item, index) => (
                            <p
                              key={index}
                              style={{
                                color: "#aaa3c4",
                                fontSize: "11px",
                                lineHeight: 1.6,
                                margin: "5px 0",
                              }}
                            >
                              {item}
                            </p>
                          )
                        )
                      ) : (
                        <p
                          style={{
                            color: "#9e97b7",
                            fontSize: "11px",
                          }}
                        >
                          No experience lines detected.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role matches */}
                  <div style={{ marginTop: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          color: "#eee8ff",
                          fontSize: "15px",
                          margin: 0,
                        }}
                      >
                        Role matches
                      </h3>

                      <span
                        style={{
                          color: "#9991b5",
                          fontSize: "10px",
                        }}
                      >
                        Sorted by detected skill overlap
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "11px",
                        marginTop: "12px",
                      }}
                    >
                      {(resumeResult.matches || []).map(
                        (job) => (
                          <article
                            key={job.id}
                            style={{
                              padding: "15px",
                              borderRadius: "13px",
                              background:
                                "rgba(255,255,255,0.035)",
                              border:
                                selectedJobId === job.id
                                  ? "1px solid rgba(183, 158, 255, 0.65)"
                                  : "1px solid rgba(255,255,255,0.09)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                                alignItems: "flex-start",
                              }}
                            >
                              <div>
                                <h4
                                  style={{
                                    color: "#e9e2ff",
                                    fontSize: "12px",
                                    margin: "0 0 5px",
                                  }}
                                >
                                  {job.title}
                                </h4>

                                <p
                                  style={{
                                    color: "#a49bbf",
                                    fontSize: "10px",
                                    margin: 0,
                                  }}
                                >
                                  {job.company}
                                </p>
                              </div>

                              <strong
                                style={{
                                  color: "#c9b8ff",
                                  fontSize: "15px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {job.matchScore}%
                              </strong>
                            </div>

                            <p
                              style={{
                                color: "#9992b2",
                                fontSize: "10px",
                                margin: "9px 0",
                              }}
                            >
                              {job.location} · {job.type}
                            </p>

                            <div
                              style={{
                                height: "5px",
                                borderRadius: "9px",
                                background:
                                  "rgba(255,255,255,0.09)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${job.matchScore}%`,
                                  height: "100%",
                                  borderRadius: "9px",
                                  background:
                                    "linear-gradient(90deg, #8269d8, #63c9c0)",
                                }}
                              />
                            </div>

                            <p
                              style={{
                                color: "#aaa3c4",
                                fontSize: "10px",
                                lineHeight: 1.6,
                                margin: "9px 0",
                              }}
                            >
                              Matched:{" "}
                              {job.matchedSkills?.length
                                ? job.matchedSkills.join(", ")
                                : "No listed skills matched"}
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setApplicationDraft("");
                                setPreparedApplication(null);
                                setApplicationPrepareError("");
                                setApplicationApproved(false);
                                setApplicationStatus("draft");
                                setShowApplicationWorkspace(false);

                                setTrackerSaved(false);
                                setTrackerSaveError("");
                                setTrackedApplicationId("");
                              }}
                              style={{
                                width: "100%",
                                padding: "9px",
                                borderRadius: "9px",
                                border:
                                  "1px solid rgba(170, 148, 255, 0.3)",
                                background:
                                  selectedJobId === job.id
                                    ? "rgba(130, 105, 215, 0.25)"
                                    : "rgba(130, 105, 215, 0.1)",
                                color: "#e3d9ff",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              {selectedJobId === job.id
                                ? "Selected role"
                                : "Select this role"}
                            </button>
                          </article>
                        )
                      )}
                    </div>
                  </div>

                  {/* Application preparation */}
                  {selectedJobId && (
                    <div
                      style={{
                        marginTop: "18px",
                        padding: "17px",
                        borderRadius: "14px",
                        background:
                          "rgba(124, 101, 198, 0.09)",
                        border:
                          "1px solid rgba(164, 143, 255, 0.22)",
                      }}
                    >
                      <h3
                        style={{
                          color: "#eee8ff",
                          fontSize: "14px",
                          margin: "0 0 5px",
                        }}
                      >
                        Prepare your application
                      </h3>

                      <p
                        style={{
                          color: "#aaa3c4",
                          fontSize: "11px",
                          lineHeight: 1.6,
                          margin: "0 0 13px",
                        }}
                      >
                        Add the details you want included. VOXERA
                        will create a draft for review. Nothing
                        is sent to an employer at this stage.
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "9px",
                        }}
                      >
                        <input
                          value={applicationName}
                          onChange={(event) =>
                            setApplicationName(event.target.value)
                          }
                          placeholder="Your name"
                          aria-label="Your name"
                          style={applicationInputStyle}
                        />

                        <input
                          value={applicationEmail}
                          onChange={(event) =>
                            setApplicationEmail(event.target.value)
                          }
                          placeholder="Email address"
                          aria-label="Email address"
                          type="email"
                          style={applicationInputStyle}
                        />

                        <input
                          value={applicationPhone}
                          onChange={(event) =>
                            setApplicationPhone(event.target.value)
                          }
                          placeholder="Phone number"
                          aria-label="Phone number"
                          style={applicationInputStyle}
                        />
                      </div>

                      <textarea
                        value={applicationNote}
                        onChange={(event) =>
                          setApplicationNote(event.target.value)
                        }
                        placeholder="Optional: add a short message or details you want the employer to know..."
                        aria-label="Application message"
                        rows={3}
                        style={{
                          ...applicationInputStyle,
                          width: "100%",
                          resize: "vertical",
                          marginTop: "9px",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const job =
                            resumeResult.matches.find(
                              (item) =>
                                item.id === selectedJobId
                            );

                          if (job) {
                            handlePrepareApplication(job);
                          }
                        }}
                        disabled={applicationPreparing}
                        style={{
                          marginTop: "11px",
                          padding: "10px 14px",
                          border: "none",
                          borderRadius: "9px",
                          background: applicationPreparing
                            ? "rgba(119, 105, 157, 0.45)"
                            : "#8069d5",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: applicationPreparing
                            ? "wait"
                            : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {applicationPreparing ? (
                          <>
                            <LoaderCircle size={15} />
                            Preparing application...
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} />
                            Prepare application preview
                          </>
                        )}
                      </button>

                      {applicationPrepareError && (
                        <p
                          role="alert"
                          style={{
                            color: "#ffc2ca",
                            fontSize: "11px",
                            marginTop: "10px",
                          }}
                        >
                          {applicationPrepareError}
                        </p>
                      )}

                      {/* The dedicated workspace replaces the old inline
                          preview after a successful preparation. */}
                    </div>
                  )}

                  <p
                    style={{
                      color: "#a69fbd",
                      fontSize: "10px",
                      lineHeight: 1.6,
                      margin: "14px 0 0",
                      padding: "10px 12px",
                      borderRadius: "9px",
                      background: "rgba(0,0,0,0.14)",
                    }}
                  >
                    Demo notice: the current role listings may
                    contain sample data and must be verified
                    before applying. Match percentages reflect
                    keyword overlap, not an employer assessment.
                    No application is submitted by VOXERA.
                  </p>

                  {resumeResult.notice && (
                    <p
                      style={{
                        color: "#8f88aa",
                        fontSize: "10px",
                        margin: "7px 0 0",
                      }}
                    >
                      {resumeResult.notice}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </section>

        {/* Capabilities */}
        <section className="capabilities-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" />
                BUILT FOR WHAT'S NEXT
              </span>

              <h2>Explore the possibilities.</h2>
            </div>

            <span className="section-counter">
              01 — 04
            </span>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((item) => (
              <CapabilityCard
                key={item.number}
                item={item}
              />
            ))}
          </div>
        </section>

        {/* More Possibilities */}
        <section className="possibilities-section">
          <div className="possibilities-heading">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              BEYOND A SINGLE CONVERSATION
            </span>

            <h2>More intelligence. One space.</h2>
          </div>

          <div className="possibilities-grid">
            {possibilities.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="possibility-item"
                  key={item.title}
                >
                  <div className="possibility-icon">
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing Section */}
        <section className="closing-section">
          <div className="closing-symbol">
            <BrainCircuit size={24} />
          </div>

          <div className="closing-copy">
            <h2>Intelligence, working together.</h2>

            <p>
              A new dimension of communication starts here.
            </p>
          </div>

          <a href="#workspace" className="closing-link">
            Explore VOXERA
            <ArrowUpRight size={16} />
          </a>
        </section>

        {/* Footer */}
        <footer className="page-footer">
          <a href="#home" className="footer-brand">
            <Orbit size={15} />
            VOXERA
          </a>

          <span>LISTEN · THINK · RESPOND</span>

          <span>A UNIVERSE OF INTELLIGENCE</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
