/** biome-ignore-all lint/suspicious/noExplicitAny: prototyping */
import "./style.css";
import { WebSocket } from "partysocket";
import type { ServerMessage } from "./protocol";
import {
  connect,
  listenForOffers,
  logErrors,
  logPeerConnection,
  type WebRtcPipe,
} from "./transport";
import { netcode, type PeerId, start } from "./ui";
import { uuidToColor } from "./util";

const remoteWsUrl = "wss://webrtc-divine-glade-8064.fly.dev/ws";
const localWsUrl = "ws://localhost:3000";

const broker = new WebSocket(remoteWsUrl);

const pipes: Map<PeerId, WebRtcPipe> = new Map();

start();

broker.addEventListener("open", () => {
  netcode.logWs("connection opened");
});

function registerPipe(pipe: WebRtcPipe) {
  logErrors(pipe.reliable);
  logErrors(pipe.unreliable);
  logPeerConnection(pipe.peerConnection, netcode.ourId);

  pipe.reliable.onmessage = (event) => {
    netcode.logRtc(`[reliable ${pipe.peerId}] ${event.data}`, pipe.peerId);
  };
  pipe.unreliable.onmessage = (event) => {
    netcode.logRtc(`[unreliable ${pipe.peerId}] ${event.data}`, pipe.peerId);
  };
  pipes.set(pipe.peerId, pipe);
}

listenForOffers(broker, (pipe) => {
  registerPipe(pipe);
});

broker.addEventListener("message", async (event) => {
  console.log("[ws] Received message:", event.data);
  if (typeof event.data !== "string") {
    console.warn("Unknown data type");
    return;
  }

  try {
    const envelope = JSON.parse(event.data) as ServerMessage;
    netcode.logWs(envelope);

    switch (envelope.type) {
      case "welcome":
        netcode.ourId = envelope.yourId;
        console.log("[ws] connected", { serverId: envelope.serverId });
        for (const peerId of envelope.peerIds) {
          if (peerId === netcode.ourId) continue;
          netcode.addPeer({
            id: peerId,
            color: uuidToColor(peerId),
            messages: [],
          });
        }
        break;
      case "message:json":
        // receive(envelope.message);
        break;
      case "peer:connect": {
        netcode.addPeer({
          id: envelope.peerId,
          color: uuidToColor(envelope.peerId),
          messages: [],
        });
        const pipe = await connect(broker, envelope.peerId);
        registerPipe(pipe);
        break;
      }
      case "peer:disconnect":
        netcode.peers = netcode.peers.filter((p) => p.id !== envelope.peerId);
        break;
      default:
        console.log("Unhandled message", envelope);
    }
  } catch (e) {
    netcode.logWs(`Unparseable message: ${event.data}`);
    console.error("Failed to parse json", event.data, e);
  }
});

broker.addEventListener("close", (event) => {
  console.log("[ws] connection closed:", event);
});

broker.addEventListener("error", (event) => {
  console.error("[ws] error:", event);
});

document.querySelector("form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const textarea = document.querySelector("textarea");
  const msg = textarea?.value;
  if (!msg) return;

  for (const [, pipe] of pipes) {
    const dc = pipe.reliable;
    if (dc.readyState !== "open") {
      console.warn("[rtc.dc] datachannel not open yet");
      continue;
    }
    dc.send(msg);
  }
});
