export interface CommunityRule {
    title: string;
    description?: string;
    createdAt?: string;
}

export interface Community {
    _id: string;
    name: string;
    title: string;
    description?: string;
    iconImage?: string;
    bannerImage?: string;
    creator?: {
        _id: string;
        username: string;
    };
    memberCount?: number;
    postCount?: number;
    privacyType?: 'public' | 'restricted' | 'private';
    rules?: CommunityRule[];
    isSubscribed?: boolean;
}