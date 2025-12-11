import {useEffect, useState, useCallback} from "react";
import api from "@/lib/api";
import PostCard from "@/components/PostCard";
import {Button} from "@/components/ui/button";
import type {Post} from "@/types/post";
import type {ApiError} from "@/types/errors.ts";

interface PostFeedProps {
    communityName?: string;
    feed?: "home" | "all";
    limit?: number;
}

export default function PostFeed({communityName, feed = "all", limit = 10}: PostFeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params: Record<string, string | number> = {
                page,
                limit,
            };

            if (communityName) {
                params.community = communityName;
            }

            if (feed) {
                params.feed = feed;
            }

            const response = await api.get("/posts", {params});

            if (response.data.status === "success") {
                const newPosts = response.data.data;

                if (page === 1) {
                    setPosts(newPosts);
                } else {
                    setPosts((prev) => [...prev, ...newPosts]);
                }

                // Check if there are more posts to load
                setHasMore(newPosts.length === limit);
            }
        } catch (err: unknown) {
            const error = err as ApiError;
            setError(error.response?.data?.message || "Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [communityName, feed, page, limit]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const loadMore = () => {
        setPage((prev) => prev + 1);
    };

    if (loading && page === 1) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="h-48 rounded-lg border bg-card animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border bg-card p-6 text-center">
                <p className="text-destructive">{error}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                        setPage(1);
                        fetchPosts();
                    }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                <p>No posts yet. Be the first to post!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post._id} post={post}/>
            ))}

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Load More"}
                    </Button>
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                    You've reached the end
                </p>
            )}
        </div>
    );
}

