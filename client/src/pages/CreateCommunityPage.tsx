import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import api from "@/lib/api";
import {useAuth} from "@/context/auth-provider";
import PostFeed from "@/components/PostFeed";
import type {Community, CommunityRule} from "@/types/community.ts";
import type {ApiError} from "@/types/errors.ts";

export default function CommunityPage() {
    const {communityName} = useParams<{ communityName: string }>();
    const {user} = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
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
            } catch (err: unknown) {
                const error = err as ApiError;
                setError(error.response?.data?.message || "Community not found");
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
                setCommunity((prev) => prev ? {...prev, memberCount: Math.max(0, (prev.memberCount || 0) - 1)} : null);
            } else {
                await api.post(`/communities/name/${communityName}/join`);
                setIsJoined(true);
                setCommunity((prev) => prev ? {...prev, memberCount: (prev.memberCount || 0) + 1} : null);
            }
        } catch (error: unknown) {
            const err = error as ApiError;
            console.error("Failed to toggle subscription:", error);
            alert(err.response?.data?.message || "Something went wrong");
        }
    };

    if (loading) return <p className="p-4">Loading…</p>;
    if (error) return <p className="p-4 text-red-600">{error}</p>;
    if (!community) return <p className="p-4">Community not found</p>;

    const getButtonText = () => {
        if (isOwner) return "Owner";
        if (community?.privacyType === 'private' && !isJoined) return "Private";
        return isJoined ? "Leave" : "Join";
    };

    const getButtonStyles = () => {
        if (isOwner) {
            return "bg-muted text-muted-foreground cursor-not-allowed";
        }
        if (community?.privacyType === 'private' && !isJoined) {
            return "bg-muted text-muted-foreground cursor-not-allowed";
        }
        if (isJoined) {
            return "border border-destructive text-destructive hover:bg-destructive hover:text-white";
        }
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    };

    const canJoin = () => {
        if (isOwner) return false;
        if (community?.privacyType === 'private' && !isJoined) return false;
        return true;
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
                        <p className="text-sm capitalize mb-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                community.privacyType === 'private' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                community.privacyType === 'restricted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                                {community.privacyType === 'private' ? '🔒' : community.privacyType === 'restricted' ? '🔐' : '🌐'}
                                {community.privacyType}
                            </span>
                        </p>

                        <button
                            onClick={handleJoinToggle}
                            disabled={!canJoin()}
                            className={`w-full rounded px-4 py-2 font-medium transition-colors ${getButtonStyles()}`}
                        >
                            {getButtonText()}
                        </button>
                    </div>

                    {community.rules && community.rules.length > 0 && (
                        <div className="rounded border p-4 bg-card">
                            <h2 className="font-semibold mb-2">Rules</h2>
                            <ol className="list-decimal pl-5 space-y-1 text-sm">
                                {community.rules.map((r: CommunityRule, i: number) => (
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
                    <PostFeed communityName={community.name}/>
                </main>
            </div>
        </div>
    );
}