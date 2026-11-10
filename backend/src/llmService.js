
const sessions = new Map();

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "llama3.2:3b";

const SYSTEM_PROMPT = `
You are VOXERA, a universal AI task orchestration assistant.

You can:
- Chat naturally and answer general questions.
- Understand conversation context.
- Help organize appointments and admissions.
- Assist with job applications and resume-related tasks.
- Explain and organize workflows.

RESUME ACCURACY RULES:
- Use only the resume information explicitly provided to you.
- Never invent skills, education, experience, projects or qualifications.
- Clearly distinguish verified resume facts from recommendations.
- If resume information is unavailable, ask the user to upload or analyze their resume.
- Never claim to have reviewed an uploaded resume unless its extracted information is provided.

Be friendly, intelligent, concise and professional.

Never claim an external task is completed unless an authorized integration confirms it.
Never invent information.
`;

async function streamReply(
  sessionId,
  message,
  onToken,
  resumeContext = ""
) {
  if (!sessionId || !message) {
    throw new Error("Session ID and message are required.");
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }

  const history = sessions.get(sessionId);

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        ...(resumeContext
          ? [
              {
                role: "system",
                content:
                  `VERIFIED RESUME INFORMATION:\n${resumeContext}\n\n` +
                  "Use these facts when answering resume-related questions. " +
                  "Do not add qualifications that are not present here."
              }
            ]
          : []),
        ...history.slice(-6),
        {
          role: "user",
          content: message
        }
      ],
      stream: true,
      keep_alive: "10m",
      options: {
  num_ctx: 1024,
  num_batch: 128,
  num_predict: 300,
  temperature: 0.5
}
    })
  });

  if (!response.ok) {
    throw new Error(
      "Ollama error: " + await response.text()
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullReply = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true
      });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const data = JSON.parse(line);
        const token = data.message?.content || "";

        if (token) {
          fullReply += token;
          onToken(token);
        }
      }
    }

    if (buffer.trim()) {
      const data = JSON.parse(buffer);
      const token = data.message?.content || "";

      if (token) {
        fullReply += token;
        onToken(token);
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullReply.trim()) {
    throw new Error(
      "The LLM returned an empty response."
    );
  }

  history.push(
    {
      role: "user",
      content: message
    },
    {
      role: "assistant",
      content: fullReply
    }
  );

  sessions.set(sessionId, history.slice(-12));

  return fullReply;
}

async function generateReply(
  sessionId,
  message,
  resumeContext = ""
) {
  let reply = "";

  await streamReply(
    sessionId,
    message,
    (token) => {
      reply += token;
    },
    resumeContext
  );

  return reply;
}

function clearConversation(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  generateReply,
  streamReply,
  clearConversation
};
