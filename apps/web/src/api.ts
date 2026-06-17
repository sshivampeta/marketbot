const API_BASE = import.meta.env.VITE_ENGINE_URL?.replace(/\/$/, "") ?? "/api";

export interface HealthResponse {
  status: string;
  counts: {
    events: number;
    signals: number;
    recommendations: number;
    approvals: number;
  };
}

export interface Signal {
  id: string;
  ticker: string;
  direction: string;
  confidence: number;
  rationale: string;
  horizon: string;
}

export interface Approval {
  id: string;
  recommendationId: string;
  status: string;
}

export interface Recommendation {
  id: string;
  ticker: string;
  action: string;
  confidence: number;
  rationale: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchJson<HealthResponse>("/health"),
  signals: () => fetchJson<{ signals: Signal[] }>("/signals?limit=20"),
  recommendations: () => fetchJson<{ recommendations: Recommendation[] }>("/recommendations?limit=20"),
  approvals: () => fetchJson<{ approvals: Approval[] }>("/approvals"),
  ingest: () => fetchJson<{ results: unknown[] }>("/ingest", { method: "POST" }),
  decideApproval: (id: string, status: "approved" | "rejected") =>
    fetchJson(`/approvals/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
};
