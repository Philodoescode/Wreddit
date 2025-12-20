import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function CommentsTab({ userId }: { userId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        api.get(`/comments/user/${userId}`)
            .then(res => setComments(res.data.data))
            .catch(err => console.error("Failed to fetch user comments", err))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div className="p-4 text-center flex justify-center"><Loader2 className="animate-spin mr-2" />Loading comments...</div>;

    if (comments.length === 0) return <Card><CardContent className="pt-6 text-center text-muted-foreground">No comments yet.</CardContent></Card>;

    return (
        <div className="space-y-4 pt-4">
            {comments.map(comment => (
                <Card key={comment._id} className="p-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                        Commented on: <span className="font-semibold text-foreground">{comment.postId?.title}</span> in r/{comment.postId?.community?.name}
                    </div>
                    <div className="pl-4 border-l-2 border-muted">
                        <p>{comment.content}</p>
                    </div>
                    <div className="mt-2">
                        <Link to={`/post/${comment.postId?._id}`} className="text-xs text-primary hover:underline">
                            View context
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    );
}
