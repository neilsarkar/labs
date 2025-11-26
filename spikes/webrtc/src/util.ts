import Alpine from "alpinejs";

export function createStore<T extends object>(name: string, def: T): T {
  Alpine.store(name, def);
  return Alpine.store(name) as T;
}

export function uuidToColor(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = (hash << 5) - hash + hex.charCodeAt(i);
    hash |= 0;
  }
  const color = (hash >>> 0).toString(16).padStart(6, "0").slice(0, 6);
  return `#${color}`;
}

export function formatTimestamp(ms: number): string {
  const date = new Date(ms);

  const hours = date.getHours() % 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const millis = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${millis}`;
}
