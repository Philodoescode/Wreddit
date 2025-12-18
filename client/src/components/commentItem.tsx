import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";
import type { Comment } from "@/types/comment";

interface Props {
  comment: Comment;
  postId: string;
  depth?: number;
  refresh: () => void;
}

export default function CommentItem({
  comment,
  postId,
  depth = 0,
  refresh,
}: Props) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReply = async () => {
    if (!replyText.trim()) return;

    try {
      setLoading(true);
      await api.post("/comments", {
        postId,
        content: replyText,
        parentId: comment._id,
      });
      setReplyText("");
      setShowReply(false);
      refresh();
    } catch (err) {
      console.error("Failed to reply", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginLeft: depth * 24 }} className="mt-4">
      <div className="rounded-md border p-3 bg-muted/40">
        <p className="text-sm font-semibold">
          u/{comment.userId.username}
          <span className="ml-2 text-xs text-muted-foreground">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </p>

        <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs"
          onClick={() => setShowReply(!showReply)}
        >
          Reply
        </Button>

        {showReply && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={submitReply} disabled={loading}>
                {loading ? "Posting..." : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recursive replies */}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          postId={postId}
          depth={depth + 1}
          refresh={refresh}
        />
      ))}
    </div>
  );
}
