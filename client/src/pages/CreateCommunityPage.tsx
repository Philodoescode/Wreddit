import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-provider";

export default function CommunityPage() {
  const { communityName } = useParams<{ communityName: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const isOwner = user?.id === community?.creator?._id;

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await api.get(`/communities/name/${communityName}`);
        setCommunity(res.data.data);
        setIsJoined(res.data.data.isSubscribed);
      } catch (err: any) {
        setError(err.response?.data?.message || "Community not found");
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityName]);

  const handleJoinToggle = async () => {
    if (isOwner) return; // Owner cannot leave
    try {
      if (isJoined) {
        await api.delete(`/communities/name/${communityName}/leave`);
        setIsJoined(false);
        setCommunity((prev: any) => ({ ...prev, memberCount: Math.max(0, (prev?.memberCount || 0) - 1) }));
      } else {
        await api.post(`/communities/name/${communityName}/join`);
        setIsJoined(true);
        setCommunity((prev: any) => ({ ...prev, memberCount: (prev?.memberCount || 0) + 1 }));
      }
    } catch (error: any) {
      console.error("Failed to toggle subscription:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  if (loading) return <p className="p-4">Loading…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  const getButtonText = () => {
    if (isOwner) return "Owner";
    return isJoined ? "Leave" : "Join";
  };

  const getButtonStyles = () => {
    if (isOwner) {
      return "bg-muted text-muted-foreground cursor-not-allowed";
    }
    if (isJoined) {
      return "border border-destructive text-destructive hover:bg-destructive hover:text-white";
    }
    return "bg-primary text-primary-foreground hover:bg-primary/90";
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">r/{community.name}</h1>
        <p className="text-lg text-muted-foreground">{community.title}</p>
        {community.description && <p className="mt-2">{community.description}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar */}
        <aside className="md:col-span-1 space-y-4">
          <div className="rounded border p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">About</h2>
            </div>
            <p className="text-sm mb-2">Created by u/{community.creator?.username ?? "unknown"}</p>
            <p className="text-sm mb-4 font-semibold">{community.memberCount || 0} Members</p>
            <p className="text-sm capitalize mb-4">{community.privacyType}</p>

            <button
              onClick={handleJoinToggle}
              disabled={isOwner}
              className={`w-full rounded px-4 py-2 font-medium transition-colors ${getButtonStyles()}`}
            >
              {getButtonText()}
            </button>
          </div>

          {community.rules?.length > 0 && (
            <div className="rounded border p-4 bg-card">
              <h2 className="font-semibold mb-2">Rules</h2>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {community.rules.map((r: any, i: number) => (
                  <li key={i}>
                    <strong>{r.title}</strong>
                    {r.description && <>: {r.description}</>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        {/* Main feed */}
        <main className="md:col-span-2">
          <div className="rounded border p-6 text-center text-muted-foreground bg-card">
            <p>No posts yet. Be the first!</p>
            <Link to={`/r/${community.name}/submit`}>
              <button className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
                Create Post
              </button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}