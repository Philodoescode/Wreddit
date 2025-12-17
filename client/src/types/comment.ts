export interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  userId: {
    username: string;
    userPhotoUrl?: string;
  };
  replies: Comment[];
}
