// src/components/CommunityPage.tsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function CommunityPage() {
  const { communityName } = useParams<{ communityName: string }>();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await api.get(`/communities/name/${communityName}`);
        setCommunity(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Community not found");
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityName]);

  if (loading) return <p className="p-4">Loading…</p>;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

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
          <div className="rounded border p-4">
            <h2 className="font-semibold">About</h2>
            <p className="text-sm">Created by u/{community.creator?.username ?? "unknown"}</p>
            <p className="text-sm capitalize">{community.privacyType}</p>
          </div>

          {community.rules?.length > 0 && (
            <div className="rounded border p-4">
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
          <div className="rounded border p-6 text-center text-muted-foreground">
            <p>No posts yet. Be the first!</p>
            <Link to={`/r/${community.name}/submit`}>
              <button className="mt-4 rounded bg-primary px-4 py-2 text-white">
                Create Post
              </button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}