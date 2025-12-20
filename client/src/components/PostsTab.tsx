import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "@/components/PostCard";

export default function PostsTab({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        api.get(`/posts?author=${userId}`)
            .then(res => setPosts(res.data.data))
            .catch(err => console.error("Failed to fetch user posts", err))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="p-4 text-center flex justify-center"><Loader2 className="animate-spin mr-2" />Loading posts...</div>;

    if (posts.length === 0) return <Card><CardContent className="pt-6 text-center text-muted-foreground">No posts yet.</CardContent></Card>;

    return (
        <div className="space-y-4 pt-4">
            {posts.map(post => (
                <PostCard key={post._id} post={post} />
            ))}
        </div>
    );
}
