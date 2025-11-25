// Credit: Jason Rametta

import type { Signal } from "./signal";

export type Message = string | ArrayBuffer | Blob | ArrayBufferView;

export type CloseDetails = { reason: string; code: number; wasClean: boolean };

export type Multiplayer = {
	/**
	 * The URL to the websocket server that support rooms
	 */
	roomUrl: string;
	/**
	 * List of ICE Server URL's to use for WebRTC.
	 * This must include atleast 1 STUN server, and optionally 1 TURN server if server Relay is desired.
	 * Default: `[{ urls: "stun:stun.l.google.com:19302" }]`
	 */
	iceServers: NonNullable<RTCConfiguration["iceServers"]>;
	/**
	 * Callback for when receiving data from other peers via WebRTC
	 * @param message The payload of the message received
	 * @param peerId The id of the peer that sent the message
	 */
	onRTCMessage: Signal<[message: Message, peerId: string]>;
	/**
	 * Callback for when a new peer connection is opened.
	 * This is called after both channels are opened with a peer (reliable channel and unreliable channel)
	 * @param peerId The id of the peer that is now connected
	 */
	onRTCOpen: Signal<[peerId: string]>;
	/**
	 * Callback for when peer connection is closed
	 * @param peerId The id of the peer that is now disconnected
	 */
	onRTCClose: Signal<[peerId: string]>;
	/**
	 * Callback for when there is an error connecting to a peer
	 * @param peerId The id of the peer associated
	 */
	onRTCError: Signal<[peerId: string]>;
	/**
	 * Callback for when any decorator RPCSignal emits.
	 * This signal emits as an addition to the decorators.
	 * @param signal The name of the signal
	 * @param peerId The id of the peer that sent the message
	 * @param args The message payload
	 */
	onRTCDecoratorCall: Signal<[signal: string, peerId: string, args: unknown[]]>;
	/**
	 * Callback for when receiving messages from the Websocket server.
	 * @param message The text payload of the message
	 * @param peerId The id of the peer who sent the message
	 */
	onRoomMessage: Signal<[message: string, peerId: string]>;
	/**
	 * Callback for when the room connection is open
	 */
	onRoomOpen: Signal;
	/**
	 * Callback for when the room connection is closed
	 */
	onRoomClose: Signal<[details: CloseDetails]>;
	/**
	 * Callback for when the room connection errors
	 */
	onRoomError: Signal;
	/**
	 * Callback for when a new peer joins the websocket room.
	 * @param peerId The id of the peer who joined the room
	 * @param peers All the peers in the room
	 */
	onRoomPeerConnect: Signal<[peerId: string, peers: string[]]>;
	/**
	 * Callback for when a peer leaves the websocket room.
	 * @param peerId The id of the peer who left the room
	 * @param peers All the peers in the room
	 */
	onRoomPeerDisconnect: Signal<[peerId: string, peers: string[]]>;
	/**
	 * All the current peer id's in the room.
	 * These are **not** WebRTC peers that are connected, just Websocket peers.
	 */
	peers: string[];
	/**
	 * The `readyState` of the room's websocket connection.
	 * Will be undefined if not connected to any room.
	 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
	 */
	roomReadyState?: number;

	/**
	 * The `id` of the current peer in the room. Used for WebRTC peers aswell.
	 * @returns string id if connected, undefined if not connected to any room.
	 */
	peerId?: string;
	/**
	 * The `id` of the current room.
	 * @returns string id if connected, undefined if not connected to any room.
	 */
	roomId?: string;
	/**
	 * Initiate a connection to a new room
	 * @param room The id or name of the room to connect. If none provided, one will be generated.
	 */
	connect(room?: string): void;
	/**
	 * Manually disconnect from the websocket room.
	 * Calling `connect()` will also disconnect from any active room connection
	 * @param args Provide an optional code and/or a reason for closing the connection
	 */
	disconnect(code?: number, reason?: string): void;
	/**
	 * Broadcast a message to all peers in the websocket room.
	 * This does **not** use WebRTC, this does a roundtrip to the server.
	 * @param text The message data
	 */
	sendWebsocketMessage(text: string): void;
	/**
	 * Send a message via WebRTC to all the peers specified.
	 * @param message  The message data
	 * @param channel  The channel used for sending the message. Default: Reliable.
	 * @param peers An array of peerId's to send the message to. Default: **all** peers.
	 */
	send(
		message: Message,
		channel?: "reliable" | "unreliable",
		peers?: string[],
	): void;
};
