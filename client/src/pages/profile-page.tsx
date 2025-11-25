import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StarIcon, TrophyIcon, CakeIcon } from "lucide-react";

import api from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/users/user/${username}`);
        setUser(response.data.data.user);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        {/* Banner */}
        <div className="h-32 md:h-48 w-full bg-muted relative">
           {user.profileBannerUrl ? (
            <img 
              src={getImageUrl(user.profileBannerUrl)} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
           ) : (
             <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500" />
           )}
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Avatar */}
            <div className="-mt-12 md:-mt-16 relative z-10">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-md">
                <AvatarImage src={getImageUrl(user.userPhotoUrl)} alt={user.username} className="object-cover" />
                <AvatarFallback className="text-2xl md:text-4xl">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* User Info */}
            <div className="flex-1 mt-2 md:mt-4 space-y-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                  <p className="text-muted-foreground font-medium">u/{user.username}</p>
                </div>
                {/* <div className="flex gap-2">
                    <Button>Follow</Button>
                    <Button variant="outline">Chat</Button>
                </div> */}
              </div>
            </div>
          </div>
          
          {/* Bio & Socials */}
          <div className="mt-6 space-y-4">
            {user.bio && (
              <div className="max-w-2xl">
                 <p className="text-sm md:text-base">{user.bio}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats & Sidebar (On mobile this comes after, but for standard grid flow we usually put main content first. Here we stick to sidebar right on desktop) */}
        
        {/* Main Content: Posts/Comments Tabs */}
        <div className="md:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {/* Placeholder for feed */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm text-center py-8">
                        u/{user.username} hasn't posted anything yet.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="posts">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">No posts to display.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comments">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">No comments to display.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
               <CardTitle className="text-base">Profile Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <StarIcon size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-medium">Karma</p>
                    <p className="text-xs text-muted-foreground">{user.userKarma}</p>
                 </div>
              </div>
              
              <Separator />

              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <CakeIcon size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-medium">Cake Day</p>
                    <p className="text-xs text-muted-foreground">{user.userAge} years ago</p>
                 </div>
              </div>

               <Separator />

              <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-600">
                    <TrophyIcon size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-medium">Gold Received</p>
                    <p className="text-xs text-muted-foreground">{user.userGold}</p>
                 </div>
              </div>

              {user.userSocialLinks && (
                <>
                  <Separator />
                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Social Links</p>
                    <a href={user.userSocialLinks} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
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