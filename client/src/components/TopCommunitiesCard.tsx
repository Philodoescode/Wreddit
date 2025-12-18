import { useEffect, useState } from "react";
import api from "@/lib/api";

interface CommunitySummary {
  _id: string;
  name: string;
  title: string;
  iconImage?: string;
  memberCount?: number;
}

export default function TopCommunitiesCard() {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await api.get("/communities");
        if (res.data.status === "success") {
          setCommunities(res.data.data.slice(0, 5));
        }
      } catch {
        // ignore errors for now
      }
    }
    fetchCommunities();
  }, []);

  return (
    <div className="rounded-md border bg-card p-3 text-sm">
      <p className="mb-2 text-sm font-semibold">Today&apos;s top communities</p>
      <ul className="space-y-2">
        {communities.map((c, i) => (
          <li key={c._id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{i + 1}</span>
              <div className="h-6 w-6 rounded-full bg-muted" />
              <span className="font-medium">r/{c.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {c.memberCount ?? 0} members
            </span>
          </li>
        ))}
        {communities.length === 0 && (
          <li className="text-xs text-muted-foreground">
            Communities will appear here as they are created.
          </li>
        )}
      </ul>
    </div>
  );
}