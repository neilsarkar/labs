console.log("Listening on port 3000...");

Bun.serve({
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}
		return new Response("Upgrade failed", { status: 500 });
	},
	websocket: {
		message(ws, message) {
			console.log({ event: "message", message });
		},
		open(ws) {
			console.log({ event: "open" });
		},
		close(ws, code, reason) {
			console.log({ event: "close", code, reason });
		},
		drain(ws) {
			console.log({ event: "drain" });
		},
	},
});
