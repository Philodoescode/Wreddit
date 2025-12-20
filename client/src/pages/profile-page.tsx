import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StarIcon, TrophyIcon, CakeIcon, Pencil, Loader2, MessageCircle } from "lucide-react";

import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileEditForm from "@/components/ProfileEditForm";
import { useAuth } from "@/context/auth-provider";
import PostsTab from "@/components/PostsTab";
import CommentsTab from "@/components/CommentsTab";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  userPhotoUrl?: string;
  profileBannerUrl?: string;
  userKarma: number;
  userContributions: number;
  userGold: number;
  userAge: number;
  userSocialLinks?: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth(); // ← This gives you the logged-in user!

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser?.username === username;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/users/user/${username}`);
        setUser(response.data.data.user);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleSaveProfile = async (data: any) => {
    setSaving(true);
    try {
      // THIS IS THE CORRECT ENDPOINT
      const response = await api.patch("/users/user/me", data);
      setUser(response.data.data.user);
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await api.patch("/users/user/me/avatar", formData);
      setUser(res.data.data.user);
    } catch (err: any) {
      alert("Failed to upload avatar");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    const formData = new FormData();
    formData.append("banner", file);

    // ADD THIS DEBUG LINE
    console.log("Using api instance:", api);
    console.log("Current token:", localStorage.getItem("token"));

    try {
      const res = await api.patch("/users/user/me/banner", formData);
      setUser(res.data.data.user);
    } catch (err: any) {
      console.error("Banner upload failed:", err.response?.status, err.response?.data);
      alert("Failed to upload banner");
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground">{error || "User not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden w-full">
        <div className="h-48 md:h-64 w-full bg-muted relative group">
          {user.profileBannerUrl ? (
            <img
              src={getImageUrl(user.profileBannerUrl)}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          )}

          {isOwnProfile && (
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
              <div className="text-white text-center">
                <Pencil className="w-8 h-8 mx-auto mb-2" />
                <span className="text-lg font-medium">Change Banner</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="-mt-16 relative group">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
                <AvatarImage src={getImageUrl(user.userPhotoUrl)} />
                <AvatarFallback className="text-4xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isOwnProfile && (
                <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                  <Pencil className="w-8 h-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 mt-4 md:mt-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user.username}
                  </h1>
                  <p className="text-lg text-muted-foreground">u/{user.username}</p>
                </div>

                {isOwnProfile ? (
                  <Button onClick={() => setEditing(true)} size="sm" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : currentUser && (
                  <Button
                    onClick={() => navigate(`/chat?newChat=${user.id}`)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                )}
              </div>

              {user.bio && <p className="text-base max-w-3xl">{user.bio}</p>}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}> {/* to remove the warning in dev tools */}
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileEditForm
            initialData={{
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              bio: user.bio || "",
              userSocialLinks: user.userSocialLinks || "",
            }}
            onCancel={() => setEditing(false)}
            onSave={handleSaveProfile}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                  Check the Posts and Comments tabs for activity.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts">
              <PostsTab userId={user.id} />
            </TabsContent>

            <TabsContent value="comments">
              <CommentsTab userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                  <StarIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">Karma</p>
                  <p className="text-2xl font-bold">{user.userKarma}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="p-2 bg-pink-100 rounded-full text-pink-600">
                  <CakeIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">Cake Day</p>
                  <p className="text-sm text-muted-foreground">
                    {user.userAge} year{user.userAge !== 1 && "s"} ago
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                  <TrophyIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium">Gold</p>
                  <p className="text-2xl font-bold">{user.userGold}</p>
                </div>
              </div>
              {user.userSocialLinks && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Social</p>
                    <a href={user.userSocialLinks} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                      {user.userSocialLinks}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}