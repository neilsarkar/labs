const iceServers: RTCConfiguration["iceServers"] = [
	{ urls: "stun:stun.cloudflare.com:3478" },
];

const pc = new RTCPeerConnection({ iceServers });

let dc: RTCDataChannel;

pc.ondatachannel = (event) => {
	dc = event.channel;
	console.log("received datachannel", { dc });
	wireDataChannel();
};

pc.onicegatheringstatechange = () => {
	console.log("ice gathering state changed: ", pc.iceGatheringState);

	if (pc.iceGatheringState === "complete") {
		console.log(
			"ICE gathering complete. Local description: ",
			pc.localDescription,
		);
		console.log(btoa(JSON.stringify(pc.localDescription)));
	}
};

pc.onconnectionstatechange = () => {
	console.log("pc.connectionState =", pc.connectionState);

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
		console.log("datachannel open");
	};

	dc.onmessage = (event) => {
		console.log("got message: ", event.data);
	};

	dc.onclose = () => {
		console.log("datachannel closed");
	};

	dc.onclosing = () => {
		console.log("datachannel closing");
	};

	dc.onerror = (err) => {
		console.error("datachannel error: ", err);
	};
}

// TAB A: call this to start (OFFER side)
async function makeOffer() {
	dc = pc.createDataChannel("game");
	wireDataChannel();

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	console.log("created offer, waiting for ICE gathering to finish...");
	console.log(btoa(JSON.stringify(offer)));
}

// TAB B: call this with the OFFER string from tab A
async function receiveOfferAndMakeAnswer(offerBase64: string) {
	const offer = JSON.parse(atob(offerBase64));
	await pc.setRemoteDescription(offer);

	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);
	console.log(btoa(JSON.stringify(answer)));
}

// TAB A: call this with the ANSWER string from tab B
async function receiveAnswer(answerBase64: string) {
	const answer = JSON.parse(atob(answerBase64));
	await pc.setRemoteDescription(answer);
	console.log("answer set, connection should establish soon");
}

// When the channel is open (either side), you can call:
function sendHello() {
	if (!dc || dc.readyState !== "open") {
		console.warn("datachannel not open yet");
		return;
	}
	dc.send("hello world");
	console.log("sent: hello world");
}

window.makeOffer = makeOffer;
window.receiveOfferAndMakeAnswer = receiveOfferAndMakeAnswer;
window.receiveAnswer = receiveAnswer;
window.sendHello = sendHello;
