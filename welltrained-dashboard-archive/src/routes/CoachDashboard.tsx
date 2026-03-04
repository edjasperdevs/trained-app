import { useAuth } from "../hooks/useAuth";
import SubmissionsList from "../components/dashboard/SubmissionsList";

export default function CoachDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-trained-black">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Branding */}
          <div className="flex items-center">
            <div className="text-lg font-black tracking-widest">
              <span className="text-trained-text">WELL</span>
              <span className="text-trained-red">TRAINED</span>
            </div>
            <span className="ml-3 text-sm text-trained-text-dim">Dashboard</span>
          </div>

          {/* Right side - User & Sign Out */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-trained-text-dim">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-trained-text-dim hover:text-trained-red transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <SubmissionsList />
      </main>
    </div>
  );
}
