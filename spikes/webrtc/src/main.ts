/** biome-ignore-all lint/suspicious/noExplicitAny: prototyping */
import "./style.css";
import Alpine from "alpinejs";
import { WebSocket } from "partysocket";

type Peer = {
  id: string;
  color: string;
  messages: string[];
};

Alpine.store("netcode", {
  websocketMessages: [],
  peers: [] as Peer[],

  logWs(message: string) {
    this.websocketMessages.push(message);
  },

  addPeer(id: string) {
    if (this.peers.find((p) => p.id === id)) return;
    this.peers.push({ id, color: uuidToColor(id), messages: [] });
  },

  logPeerMessage(peerId: string, message: string) {
    const peer = this.peers.find((p) => p.id === peerId);
    if (!peer) {
      console.warn(`No peer with id ${peerId}`);
      return;
    }
    peer.messages.push(message);
  },
});

Alpine.start();

const remoteWsUrl = "wss://webrtc-divine-glade-8064.fly.dev/ws";

const localWsUrl = "ws://localhost:3000";

const ws = new WebSocket(remoteWsUrl);

type ServerMessage =
  | {
      type: "welcome";
      yourId: string;
      peerIds: string[];
      serverId: string;
    }
  | {
      type: "message:json";
      peerId: string;
      message: PeerMessage;
    }
  | {
      type: "message:string";
      peerId: string;
      message: string;
    }
  | {
      type: "message:buffer";
      peerId: string;
      message: ArrayBuffer;
    }
  | {
      type: "peer:connect";
      peerId: string;
    }
  | {
      type: "peer:disconnect";
      peerId: string;
    };

type PeerMessage =
  | {
      type: "offer";
      target: string;
      payload: string;
    }
  | {
      type: "answer";
      target: string;
      payload: string;
    }
  | {
      type: "message";
      payload: any;
    };

let dc: RTCDataChannel;
let ourId: string;

ws.addEventListener("open", () => {
  console.log("[ws] connection opened");
});

ws.addEventListener("message", async (event) => {
  console.log("[ws] Received message:", event.data);
  if (typeof event.data !== "string") {
    console.warn("Unknown data type");
    return;
  }

  try {
    const envelope = JSON.parse(event.data) as ServerMessage;
    Alpine.store("netcode").logWs(JSON.stringify(envelope, null, 2));

    switch (envelope.type) {
      case "welcome":
        ourId = envelope.yourId;
        console.log("[ws] connected", { serverId: envelope.serverId });
        for (const peerId of envelope.peerIds) {
          if (peerId === ourId) continue;
          Alpine.store("netcode").addPeer(peerId);
        }
        break;
      case "message:json":
        receive(envelope.message);
        break;
      case "peer:connect":
        Alpine.store("netcode").addPeer(envelope.peerId);
        await makeOffer();
        break;
      default:
        console.log("Unhandled message", envelope);
    }
  } catch (e) {
    console.error("Failed to parse json", event.data, e);
  }
});

async function receive(msg: PeerMessage) {
  console.log("receiving message", msg.type, msg, typeof msg === "string");
  switch (msg.type) {
    case "offer":
      await receiveOfferAndMakeAnswer(msg.payload);
      break;
    case "answer":
      await receiveAnswer(msg.payload);
      break;
  }
}

function send(msg: PeerMessage) {
  ws.send(JSON.stringify(msg));
}

ws.addEventListener("close", (event) => {
  console.log("[ws] connection closed:", event);
});

ws.addEventListener("error", (event) => {
  console.error("[ws] error:", event);
});

const iceServers: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.cloudflare.com:3478" },
];

const pc = new RTCPeerConnection({ iceServers });

pc.ondatachannel = (event) => {
  dc = event.channel;
  console.log("[rtc.pc] received datachannel", { dc });
  wireDataChannel();
};

pc.onicegatheringstatechange = () => {
  console.log("[rtc.pc] ice gathering state changed: ", pc.iceGatheringState);

  if (pc.iceGatheringState === "complete") {
    console.log(
      "[rtc.pc] ICE gathering complete. Local description: ",
      pc.localDescription
    );
    const offer = btoa(JSON.stringify(pc.localDescription));
    send({ type: "offer", payload: offer, target: "nope" });
  }
};

pc.onconnectionstatechange = () => {
  console.log("[rtc.pc] connectionState =", pc.connectionState);

  switch (pc.connectionState) {
    case "connected":
      // all good
      break;
    case "disconnected":
      // transient loss (wifi blip etc.), might recover
      break;
    case "failed":
      // ICE failed, probably need to tear down + recreate
      break;
    case "closed":
      // you (or the other side) closed the connection
      break;
  }
};

function wireDataChannel() {
  dc.onopen = () => {
    console.log("[rtc.dc] datachannel open");
  };

  dc.onmessage = (event) => {
    console.log("[rtc.dc] got message: ", event.data);
    const messages = document.querySelector(".messages");
    if (!messages) {
      console.warn(`Can't find .messages element`);
      return;
    }
    messages.appendChild(document.createElement("pre")).textContent =
      event.data;
  };

  dc.onclose = () => {
    console.log("[rtc.dc] datachannel closed");
  };

  dc.onclosing = () => {
    console.log("[rtc.dc] datachannel closing");
  };

  dc.onerror = (err) => {
    console.error("[rtc.dc] datachannel error: ", err);
  };
}

async function makeOffer() {
  const reliable: RTCDataChannelInit = {};
  const unreliable: RTCDataChannelInit = {
    ordered: false,
    maxRetransmits: 0,
  };

  dc = pc.createDataChannel("unreliable", unreliable);
  // dc = pc.createDataChannel("reliable", reliable);
  wireDataChannel();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log("[rtc.pc] created offer, waiting for ICE gathering to finish...");
}

async function receiveOfferAndMakeAnswer(offerBase64: string) {
  const offer = JSON.parse(atob(offerBase64));
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  console.log("[rtc.pc] created answer");
  send({
    type: "answer",
    payload: btoa(JSON.stringify(answer)),
    target: "nope",
  });
}

async function receiveAnswer(answerBase64: string) {
  const answer = JSON.parse(atob(answerBase64));
  await pc.setRemoteDescription(answer);
  console.log("[rtc.pc] answer set, connection should establish soon");
}

document.querySelector("form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const textarea = document.querySelector("textarea");
  const msg = textarea?.value;
  if (!msg) return;

  if (!dc || dc.readyState !== "open") {
    console.warn("[rtc.dc] datachannel not open yet");
    return;
  }
  dc.send(msg);
});

function uuidToColor(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = (hash << 5) - hash + hex.charCodeAt(i);
    hash |= 0;
  }
  const color = (hash >>> 0).toString(16).padStart(6, "0").slice(0, 6);
  return `#${color}`;
}
