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
import CommentSection from "@/components/commentSection";

import type {Post} from "@/types/post";
import type {ApiError} from "@/types/errors.ts";
import AiSummary from "@/components/AiSummary";

export default function PostDetailPage() {
    const {id} = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userVote, setUserVote] = useState<1 | -1 | null>(null);
    const [upvotes, setUpvotes] = useState(0);
    const [downvotes, setDownvotes] = useState(0);
    const [isVoting, setIsVoting] = useState(false);

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await api.get(`/posts/${id}`);
            const data: Post = res.data.data;

            setPost(data);
            setUserVote(data.currentUserVote ?? null);
            setUpvotes(data.upvotes);
            setDownvotes(data.downvotes);
        } catch (err) {
            const e = err as ApiError;
            setError(e.response?.data?.message || "Failed to load post");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    if (loading)
        return (
            <div className="container mx-auto max-w-4xl p-4">
                <div className="h-96 rounded-lg border bg-card animate-pulse"/>
            </div>
        );

    if (error || !post)
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

    const netVotes = upvotes - downvotes;

    const handleVote = async (value: 1 | -1) => {
        if (isVoting) return;
        setIsVoting(true);

        const prevUp = upvotes;
        const prevDown = downvotes;
        const prevVote = userVote;

        let newUserVote: 1 | -1 | null = value;

        if (userVote === value) {
            if (value === 1) setUpvotes(v => v - 1);
            else setDownvotes(v => v - 1);
            newUserVote = null;
        } else if (userVote === -value) {
            if (value === 1) {
                setUpvotes(v => v + 1);
                setDownvotes(v => v - 1);
            } else {
                setDownvotes(v => v + 1);
                setUpvotes(v => v - 1);
            }
        } else {
            if (value === 1) setUpvotes(v => v + 1);
            else setDownvotes(v => v + 1);
        }

        setUserVote(newUserVote);

        try {
            await api.post("/vote", {
                postId: post._id,
                value,
            });
        } catch (err) {
            console.error("Vote failed", err);
            setUpvotes(prevUp);
            setDownvotes(prevDown);
            setUserVote(prevVote);
        } finally {
            setIsVoting(false);
        }
    };

    const arrowClass = (v: 1 | -1) =>
        userVote === v ? (v === 1 ? "text-orange-500" : "text-purple-500") : "";

    return (
        <div className="container mx-auto max-w-4xl p-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to={`/r/${post.community.name}`}
                              className="font-semibold hover:underline flex items-center gap-1">
                            {post.community.iconImage && (
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={getImageUrl(post.community.iconImage)}/>
                                    <AvatarFallback>{post.community.name[0]}</AvatarFallback>
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
                    <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                    {post.type !== "text" && (
                        <Badge variant="secondary" className="mb-4">
                            {post.type === "media" ? "Media" : "Link"}
                        </Badge>
                    )}

                    {post.body && <p className="mb-4 whitespace-pre-wrap">{post.body}</p>}

                    {post.linkUrl && (
                        <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline block mb-4">
                            {post.linkUrl}
                        </a>
                    )}

                    {post.mediaUrls?.length > 0 && (
                        <div className="mb-4 space-y-4">
                            {post.mediaUrls.map((url, i) =>
                                isVideoUrl(url) ? (
                                    <video key={i} src={getImageUrl(url)} controls className="rounded-md w-full"/>
                                ) : (
                                    <img key={i} src={getImageUrl(url)} className="rounded-md w-full"/>
                                )
                            )}
                        </div>
                    )}

                    {/* AI Summary */}
                    {post.body && post.body.trim().length >= 50 && (
                        <AiSummary postId={post._id} />
                    )}

                    <Separator className="my-4"/>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                            <Button variant="ghost" size="icon"
                                    className={`${arrowClass(1)} hover:text-orange-500 hover:bg-orange-500/10 transition-colors`}
                                    onClick={() => handleVote(1)}>
                                <ArrowBigUp/>
                            </Button>
                            <span className="font-semibold">{netVotes}</span>
                            <Button variant="ghost" size="icon"
                                    className={`${arrowClass(-1)} hover:text-purple-500 hover:bg-purple-500/10 transition-colors`}
                                    onClick={() => handleVote(-1)}>
                                <ArrowBigDown/>
                            </Button>
                        </div>

                        <Button variant="ghost" size="sm" className="gap-2">
                            <MessageSquare className="h-4 w-4"/>
                            {post.commentCount} Comments
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
                <CardContent className="p-6">
                    <CommentSection postId={post._id}/>
                </CardContent>
            </Card>
        </div>
    );
}
