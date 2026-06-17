import { useCallback, useEffect, useState } from "react";
import { api, type Approval, type Recommendation, type Signal } from "./api";

export function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [counts, setCounts] = useState({ events: 0, signals: 0, recommendations: 0, approvals: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const [health, signalData, recData, apprData] = await Promise.all([
      api.health(),
      api.signals(),
      api.recommendations(),
      api.approvals(),
    ]);
    setCounts(health.counts);
    setSignals(signalData.signals);
    setRecommendations(recData.recommendations);
    setApprovals(apprData.approvals);
  }, []);

  useEffect(() => {
    refresh().catch((err) => setError(String(err)));
  }, [refresh]);

  async function handleIngest() {
    setLoading(true);
    setError(null);
    try {
      await api.ingest();
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setLoading(true);
    setError(null);
    try {
      await api.decideApproval(id, status);
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div className="layout">
      <header>
        <h1>MarketBot</h1>
        <p className="subtitle">Human-in-the-loop market intelligence dashboard</p>
      </header>

      <section className="stats">
        <div className="stat"><span>Events</span><strong>{counts.events}</strong></div>
        <div className="stat"><span>Signals</span><strong>{counts.signals}</strong></div>
        <div className="stat"><span>Recommendations</span><strong>{counts.recommendations}</strong></div>
        <div className="stat"><span>Pending Approvals</span><strong>{pendingApprovals.length}</strong></div>
      </section>

      <div className="actions">
        <button onClick={handleIngest} disabled={loading}>
          {loading ? "Running..." : "Run Ingestion"}
        </button>
        <button onClick={() => refresh()} disabled={loading}>Refresh</button>
      </div>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Pending Approvals</h2>
        {pendingApprovals.length === 0 ? (
          <p className="empty">No pending approvals.</p>
        ) : (
          <ul className="list">
            {pendingApprovals.map((approval) => {
              const rec = recommendations.find((r) => r.id === approval.recommendationId);
              if (!rec) return null;
              return (
                <li key={approval.id} className="card">
                  <div>
                    <strong>{rec.action.toUpperCase()} {rec.ticker}</strong>
                    <p>{rec.rationale}</p>
                    <small>Confidence: {(rec.confidence * 100).toFixed(0)}%</small>
                  </div>
                  <div className="card-actions">
                    <button className="approve" onClick={() => handleDecision(approval.id, "approved")}>Approve</button>
                    <button className="reject" onClick={() => handleDecision(approval.id, "rejected")}>Reject</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent Signals</h2>
        <ul className="list">
          {signals.slice(0, 10).map((signal) => (
            <li key={signal.id} className="card compact">
              <strong>{signal.ticker}</strong>
              <span className={`badge ${signal.direction}`}>{signal.direction}</span>
              <span>{(signal.confidence * 100).toFixed(0)}%</span>
              <p>{signal.rationale}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
