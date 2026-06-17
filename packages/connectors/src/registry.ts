import type { Connector, SourceKind } from "./index.js";

const connectors = new Map<SourceKind, Connector>();

export function registerConnector(connector: Connector): void {
  connectors.set(connector.kind, connector);
}

export function getConnector(kind: SourceKind): Connector | undefined {
  return connectors.get(kind);
}

export function listConnectors(): Connector[] {
  return [...connectors.values()];
}
