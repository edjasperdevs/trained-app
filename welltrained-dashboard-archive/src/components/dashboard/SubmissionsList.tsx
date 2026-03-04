import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { fetchSubmissions } from "../../lib/dashboardApi";
import StatusBadge from "./StatusBadge";
import type { SubmissionWithPhotos } from "../../types/dashboard";
import { STATUS_OPTIONS } from "../../types/dashboard";

export default function SubmissionsList() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Load submissions on mount
  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSubmissions();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  // Filter submissions locally
  const filteredSubmissions = useMemo(() => {
    if (activeFilter === "all") {
      return submissions;
    }
    return submissions.filter((s) => s.status === activeFilter);
  }, [submissions, activeFilter]);

  // Count submissions by status
  const counts = useMemo(() => {
    const countMap: Record<string, number> = { all: submissions.length };
    STATUS_OPTIONS.forEach(({ value }) => {
      countMap[value] = submissions.filter((s) => s.status === value).length;
    });
    return countMap;
  }, [submissions]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-trained-red text-lg font-black tracking-widest animate-pulse">
          Loading submissions...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-trained-red text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page title */}
      <h1 className="text-2xl font-bold text-trained-text">Submissions</h1>

      {/* Filter tabs */}
      <div className="mt-6 mb-8 flex flex-wrap gap-2">
        {/* All tab */}
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-trained-red text-white"
              : "bg-white/5 text-trained-text-dim hover:bg-white/10"
          }`}
        >
          All ({counts.all})
        </button>

        {/* Status tabs */}
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === value
                ? "bg-trained-red text-white"
                : "bg-white/5 text-trained-text-dim hover:bg-white/10"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-16 text-trained-text-dim">
          {activeFilter === "all"
            ? "No submissions found."
            : `No ${activeFilter} submissions found.`}
        </div>
      )}

      {/* Submissions list */}
      {filteredSubmissions.length > 0 && (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/coach/submission/${sub.id}`)}
              className="bg-white/[0.03] border border-white/10 rounded-lg p-5 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {/* Top row: Name/Email + Status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-trained-text font-semibold">{sub.full_name}</div>
                  <div className="text-sm text-trained-text-dim">{sub.email}</div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              {/* Bottom row: Details */}
              <div className="flex flex-wrap gap-4 text-sm text-trained-text-dim">
                {sub.primary_goal && (
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-trained-text/60">Goal:</span>{" "}
                    {sub.primary_goal.length > 60
                      ? sub.primary_goal.substring(0, 60) + "..."
                      : sub.primary_goal}
                  </div>
                )}
                {sub.commitment_level && (
                  <div>
                    <span className="text-trained-text/60">Commitment:</span> {sub.commitment_level}/10
                  </div>
                )}
                <div>
                  <span className="text-trained-text/60">Submitted:</span>{" "}
                  {new Date(sub.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <span className="text-trained-text/60">Photos:</span> {sub.intake_photos.length}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
