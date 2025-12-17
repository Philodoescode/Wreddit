import { Link } from "react-router-dom";
import { ArrowBigDown, ArrowBigUp, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeAgo, getImageUrl, isVideoUrl } from "@/lib/utils";
import type { Post } from "@/types/post";
import { useEffect, useState } from "react";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  // ✅ Initialize from backend
  const [userVote, setUserVote] = useState<1 | -1 | null>(post.currentUserVote ?? null);
  const [upvotes, setUpvotes] = useState(post.upvotes);

  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [isVoting, setIsVoting] = useState(false);

  // Sync state with props when data changes
  useEffect(() => {
    setUserVote(post.currentUserVote ?? null);
    setUpvotes(post.upvotes);
    setDownvotes(post.downvotes);
  }, [post]);

  const netVotes = upvotes - downvotes;

  const handleVote = async (value: 1 | -1) => {
    if (isVoting) return; // Prevent double voting
    setIsVoting(true);

    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    let newUserVote: 1 | -1 | null = value;

    // Optimistic UI update
    if (userVote === value) {
      // Remove vote
      if (value === 1) setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
      newUserVote = null;
    } else if (userVote === -value) {
      // Switch vote
      if (value === 1) {
        setUpvotes((v) => v + 1);
        setDownvotes((v) => v - 1);
      } else {
        setDownvotes((v) => v + 1);
        setUpvotes((v) => v - 1);
      }
    } else {
      // New vote
      if (value === 1) setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
    }

    setUserVote(newUserVote);

    try {
      await api.post("/vote", { postId: post._id, value });
    } catch (err) {
      console.error("Vote failed", err);
      // Rollback on error
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
    } finally {
      setIsVoting(false);
    }
  };

  const getArrowClass = (value: 1 | -1) => {
    if (userVote === value) return value === 1 ? "text-orange-500" : "text-purple-500";
    return "";
  };

  const getPreviewText = (text: string, maxLength: number = 200) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-0">
        <div className="flex gap-2">
          {/* Vote section */}
          <div className="flex flex-col items-center gap-1 bg-muted/50 p-2 rounded-l-lg z-10">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-primary/10 hover:text-primary ${getArrowClass(1)}`}
              aria-label="Upvote"
              onClick={(e) => {
                e.stopPropagation();
                handleVote(1);
              }}
            >
              <ArrowBigUp className="h-5 w-5" />
            </Button>

            <span className="text-sm font-semibold">{netVotes}</span>

            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-destructive/10 hover:text-destructive ${getArrowClass(-1)}`}
              aria-label="Downvote"
              onClick={(e) => {
                e.stopPropagation();
                handleVote(-1);
              }}
            >
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Content section */}
          <Link
            to={`/posts/${post._id}`}
            className="flex-1 p-3 block hover:bg-accent/50 transition-colors rounded-r-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Link
                to={`/r/${post.community.name}`}
                className="font-semibold hover:underline flex items-center gap-1 z-10 relative"
              >
                {post.community.iconImage && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={getImageUrl(post.community.iconImage)} />
                    <AvatarFallback>{post.community.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                r/{post.community.name}
              </Link>
              <span>•</span>
              <span>
                Posted by{" "}
                <Link to={`/user/${post.author.username}`} className="hover:underline z-10 relative">
                  u/{post.author.username}
                </Link>
              </span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>

            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>

            {post.type !== "text" && (
              <Badge variant="secondary" className="mb-2 text-xs">
                {post.type === "media" ? "Media" : "Link"}
              </Badge>
            )}

            {post.body && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {getPreviewText(post.body)}
              </p>
            )}

            {post.linkUrl && (
              <div className="mb-3">
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-block max-w-full truncate z-10 relative"
                >
                  {post.linkUrl}
                </a>
              </div>
            )}

            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3">
                {isVideoUrl(post.mediaUrls[0]) ? (
                  <video
                    src={getImageUrl(post.mediaUrls[0])}
                    controls
                    className="rounded-md max-h-64 w-full"
                  />
                ) : (
                  <img
                    src={getImageUrl(post.mediaUrls[0])}
                    alt="Post media"
                    className="rounded-md max-h-64 object-cover"
                  />
                )}
                {post.mediaUrls.length > 1 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    +{post.mediaUrls.length - 1} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2 h-8">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{post.commentCount} Comments</span>
              </Button>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
