
require("dotenv").config();

const http = require("http");
const WebSocket = require("ws");
const app = require("./app");

const PORT = process.env.PORT || 5000;
const GNANI_URL = "wss://api.vachana.ai/stt/v3/stream";

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  path: "/api/voice/stream",
});

wss.on("connection", (client) => {
  console.log("VOXERA browser connected");

  const apiKey = process.env.GNANI_API_KEY;

  if (!apiKey) {
    console.error("GNANI_API_KEY is missing from backend/.env");

    client.send(JSON.stringify({
      type: "error",
      message: "Gnani API key is missing. Check backend/.env.",
    }));

    client.close(1011, "Gnani API key missing");
    return;
  }

  let gnaniReady = false;
  let clientClosed = false;

  const gnani = new WebSocket(GNANI_URL, {
    handshakeTimeout: 15000,
    headers: {
      "x-api-key-id": apiKey,
      model: "prisma-v3.0",
      language_code: "en-IN",
      "x-sample-rate": "16000",
    },
  });

  function sendToClient(data) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  gnani.on("open", () => {
    console.log("Gnani WebSocket handshake succeeded.");
    console.log("Waiting for Gnani connected event...");
  });

  gnani.on("message", (raw, isBinary) => {
    if (isBinary) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw, { binary: true });
      }
      return;
    }

    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      console.log("Gnani sent a non-JSON message.");
      return;
    }

    console.log("Gnani event:", data.type || "unknown");
    console.log("Gnani full response:", JSON.stringify(data));

    if (data.type === "connected") {
      gnaniReady = true;

      console.log("Gnani speech recognition is ready.");

      sendToClient({
        type: "ready",
        message: "Gnani speech recognition is ready.",
      });

      return;
    }

    if (data.type === "error") {
      console.error("Gnani service error:", data);

      sendToClient({
        type: "error",
        message: data.message || "Gnani returned an error.",
      });

      return;
    }

    if (data.type === "transcript") {
      console.log("Transcript received:", data.text);
    }

    // Forward transcript and processing events to the browser.
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

  client.on("message", (raw, isBinary) => {
    if (
      gnani.readyState !== WebSocket.OPEN ||
      !gnaniReady
    ) {
      return;
    }

    if (isBinary) {
      if (raw.length !== 1024) {
        console.error(
          "Invalid PCM frame:",
          raw.length,
          "bytes. Expected 1024 bytes."
        );
        return;
      }

      gnani.send(raw, { binary: true });
      return;
    }

    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      sendToClient({
        type: "error",
        message: "Invalid message from VOXERA frontend.",
      });
      return;
    }

    if (data.type === "commit") {
      console.log("Sending commit to Gnani...");
      gnani.send(JSON.stringify({ type: "commit" }));
    }
  });

  gnani.on("unexpected-response", (_request, response) => {
    console.error(
      "Gnani rejected the connection:",
      response.statusCode,
      response.statusMessage
    );

    sendToClient({
      type: "error",
      message:
        response.statusCode === 401
          ? "Gnani authentication failed. Check your API key."
          : `Gnani connection rejected: HTTP ${response.statusCode}.`,
    });
  });

  gnani.on("error", (error) => {
    console.error("Gnani WebSocket error:", error.message);

    sendToClient({
      type: "error",
      message: `Gnani connection error: ${error.message}`,
    });
  });

  gnani.on("close", (code, reason) => {
    gnaniReady = false;

    console.log(
      "Gnani connection closed:",
      code,
      reason.toString()
    );

    if (!clientClosed && client.readyState === WebSocket.OPEN) {
      sendToClient({
        type: "error",
        message: `Gnani disconnected (${code}). Check the backend terminal.`,
      });

      client.close();
    }
  });

  client.on("error", (error) => {
    console.error("VOXERA browser WebSocket error:", error.message);
  });

  client.on("close", () => {
    clientClosed = true;
    gnaniReady = false;

    console.log("VOXERA browser disconnected");

    if (
      gnani.readyState === WebSocket.OPEN ||
      gnani.readyState === WebSocket.CONNECTING
    ) {
      gnani.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`VOXERA backend running at http://localhost:${PORT}`);
  console.log("Voice WebSocket: ws://localhost:5000/api/voice/stream");
});
