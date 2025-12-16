import {Link, useParams} from "react-router-dom";
import {useCallback, useEffect, useState} from "react";
import {ArrowBigDown, ArrowBigUp, MessageSquare, Share2} from "lucide-react";
import api from "@/lib/api";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {formatTimeAgo, getImageUrl, isVideoUrl} from "@/lib/utils";
import type {Post} from "@/types/post";
import type {ApiError} from "@/types/errors.ts";
import AiSummary from "@/components/AiSummary";

export default function PostDetailPage() {
    const {id} = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/posts/${id}`);

            if (response.data.status === "success") {
                setPost(response.data.data);
            }
        } catch (err: unknown) {
            const error = err as ApiError;
            setError(error.response?.data?.message || "Failed to load post");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl p-4">
                <div className="h-96 rounded-lg border bg-card animate-pulse"/>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="container mx-auto max-w-4xl p-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive">{error || "Post not found"}</p>
                        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const netVotes = post.upvotes - post.downvotes;

    return (
        <div className="container mx-auto max-w-4xl p-4">
            <Card>
                <CardHeader className="pb-3">
                    {/* Community and author info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            to={`/r/${post.community.name}`}
                            className="font-semibold hover:underline flex items-center gap-1"
                        >
                            {post.community.iconImage && (
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={getImageUrl(post.community.iconImage)}/>
                                    <AvatarFallback>{post.community.name[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                            r/{post.community.name}
                        </Link>
                        <span>•</span>
                        <span>
              Posted by{" "}
                            <Link to={`/user/${post.author.username}`} className="hover:underline">
                u/{post.author.username}
              </Link>
            </span>
                        <span>•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Title */}
                    <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                    {/* Post type badge */}
                    {post.type !== "text" && (
                        <Badge variant="secondary" className="mb-4">
                            {post.type === "media" ? "Media" : "Link"}
                        </Badge>
                    )}

                    {/* Body content */}
                    {post.body && (
                        <div className="prose prose-neutral dark:prose-invert max-w-none mb-4">
                            <p className="whitespace-pre-wrap">{post.body}</p>
                        </div>
                    )}

                    {/* Link */}
                    {post.linkUrl && (
                        <div className="mb-4">
                            <a
                                href={post.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-block break-all"
                            >
                                {post.linkUrl}
                            </a>
                        </div>
                    )}

                    {/* Media */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="mb-4 space-y-4">
                            {post.mediaUrls.map((url, index) => (
                                isVideoUrl(url) ? (
                                    <video
                                        key={index}
                                        src={getImageUrl(url)}
                                        controls
                                        className="rounded-md max-w-full w-full"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <img
                                        key={index}
                                        src={getImageUrl(url)}
                                        alt={`Post media ${index + 1}`}
                                        className="rounded-md max-w-full"
                                    />
                                )
                            ))}
                        </div>
                    )}

                    {/* AI Summary */}
                    {post.body && post.body.trim().length >= 50 && (
                        <AiSummary postId={post._id} />
                    )}

                    <Separator className="my-4"/>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Vote buttons */}
                        <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                            <Button variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                <ArrowBigUp className="h-5 w-5"/>
                            </Button>
                            <span className="text-sm font-semibold min-w-8 text-center">{netVotes}</span>
                            <Button variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <ArrowBigDown className="h-5 w-5"/>
                            </Button>
                        </div>

                        {/* Comments */}
                        <Button variant="ghost" size="sm" className="gap-2">
                            <MessageSquare className="h-4 w-4"/>
                            <span>{post.commentCount} Comments</span>
                        </Button>

                        {/* Share */}
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4"/>
                            <span>Share</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Comments section placeholder */}
            <Card className="mt-4">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Comments section coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
}

