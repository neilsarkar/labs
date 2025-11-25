export class Signal<T extends unknown[] = []> {
	private listeners: Array<(...data: T) => void> = [];

	// Returns a function that removes the listener
	connect(listener: (...data: T) => void) {
		this.listeners.push(listener);

		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	emit(...data: T) {
		for (const listener of this.listeners) {
			listener(...data);
		}
	}

	disconnect() {
		this.listeners = [];
	}
}
