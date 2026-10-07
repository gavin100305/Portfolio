export interface Env {
  ALLOWED_ORIGIN: string;
  PRESENCE_TICKET_SECRET: string;
  COORDINATOR: DurableObjectNamespace;
  LOBBIES: DurableObjectNamespace;
}
