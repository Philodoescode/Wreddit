import type {Community} from "@/types/community.ts";

export interface Author {
    _id: string;
    username: string;
    userPhotoUrl?: string;
}

export interface Post {
    _id: string;
    title: string;
    slug: string;
    type: 'text' | 'media' | 'link';
    body: string;
    linkUrl: string | null;
    mediaUrls: string[];
    author: Author;
    community: Community;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    currentUserVote?: 1 | -1 | null;
}

