import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import CommentItem from "@/components/commentItem";
import type { Comment } from "@/types/comment";

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/${postId}/comments`);
      setComments(res.data.data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setPosting(true);
      await api.post("/comments", {
        postId,
        content: newComment,
      });
      setNewComment("");
      loadComments();
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comments</h2>

      {/* New comment input */}
      <div className="space-y-2">
        <Textarea
          placeholder="What are your thoughts?"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={submitComment} disabled={posting}>
            {posting ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={postId}
            refresh={loadComments}
          />
        ))
      )}
    </div>
  );
}
