import {Link} from "react-router-dom";
import {ArrowBigDown, ArrowBigUp, MessageSquare} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {formatTimeAgo, getImageUrl} from "@/lib/utils";
import type {Post} from "@/types/post";

interface PostCardProps {
    post: Post;
}

export default function PostCard({post}: PostCardProps) {
    // Calculate net votes
    const netVotes = post.upvotes - post.downvotes;


    // Get preview text from body
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
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            aria-label="Upvote"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ArrowBigUp className="h-5 w-5"/>
                        </Button>
                        <span className="text-sm font-semibold">{netVotes}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Downvote"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ArrowBigDown className="h-5 w-5"/>
                        </Button>
                    </div>

                    {/* Content section - Clickable wrapper */}
                    <Link to={`/posts/${post._id}`}
                          className="flex-1 p-3 block hover:bg-accent/50 transition-colors rounded-r-lg">
                        {/* Header with community and author info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Link
                                to={`/r/${post.community.name}`}
                                className="font-semibold hover:underline flex items-center gap-1 z-10 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {post.community.iconImage && (
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={getImageUrl(post.community.iconImage)}/>
                                        <AvatarFallback>{post.community.name[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )}
                                r/{post.community.name}
                            </Link>
                            <span>•</span>
                            <span>
                Posted by{" "}
                                <Link
                                    to={`/user/${post.author.username}`}
                                    className="hover:underline z-10 relative"
                                    onClick={(e) => e.stopPropagation()}
                                >
                  u/{post.author.username}
                </Link>
              </span>
                            <span>•</span>
                            <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>

                        {/* Post title */}
                        <h3 className="text-lg font-semibold mb-2">
                            {post.title}
                        </h3>

                        {/* Post type badge */}
                        {post.type !== "text" && (
                            <Badge variant="secondary" className="mb-2 text-xs">
                                {post.type === "media" ? "Media" : "Link"}
                            </Badge>
                        )}

                        {/* Preview content */}
                        {post.body && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                {getPreviewText(post.body)}
                            </p>
                        )}

                        {/* Link preview */}
                        {post.linkUrl && (
                            <div className="mb-3">
                                <a
                                    href={post.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline inline-block max-w-full truncate z-10 relative"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {post.linkUrl}
                                </a>
                            </div>
                        )}

                        {/* Media preview */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="mb-3">
                                <img
                                    src={getImageUrl(post.mediaUrls[0])}
                                    alt="Post media"
                                    className="rounded-md max-h-64 object-cover"
                                />
                                {post.mediaUrls.length > 1 && (
                                    <Badge variant="secondary" className="mt-2 text-xs">
                                        +{post.mediaUrls.length - 1} more
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Footer with comments */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 h-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MessageSquare className="h-4 w-4"/>
                                <span className="text-xs">{post.commentCount} Comments</span>
                            </Button>
                        </div>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

