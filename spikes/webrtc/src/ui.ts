import Alpine from "alpinejs";
import { createStore, formatTimestamp } from "./util";

export type Peer = {
  id: string;
  color: string;
  messages: Message[];
};

export type PeerId = string;

export type Message = {
  timestamp: number;
  channel: string;
  content: string;
  from?: PeerId;
  to?: PeerId;
};

export const netcode = createStore("netcode", {
  peers: [] as Peer[],
  websocketMessages: [] as Message[],
  ourId: "",

  addPeer(peer: Peer) {
    this.peers.push(peer);
  },

  logWs(text: string | any) {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    this.websocketMessages.push({
      timestamp: Date.now(),
      channel: "websocket",
      content: text,
    });
  },

  logRtc(text: string | any, toPeerId?: PeerId) {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    this.websocketMessages.push({
      timestamp: Date.now(),
      channel: "webrtc",
      content: text,
      to: toPeerId,
    });
  },

  format(timestamp: number) {
    return formatTimestamp(timestamp);
  },
});

export function start() {
  Alpine.start();
}
