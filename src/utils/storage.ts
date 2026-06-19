const CLIENT_ID_KEY = "nippon-quest-client-id";

export function getClientId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
