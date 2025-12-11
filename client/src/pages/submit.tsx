import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import CommunityCombobox from "@/components/community-combobox";
import SubmitTabs from "@/components/submit-tabs";
import { Loader2 } from "lucide-react";

interface Community {
  _id: string;
  name: string;
  title: string;
  iconImage?: string;
  memberCount?: number;
}

interface TabValidation {
  isValid: boolean;
  title: string;
  body: string;
  linkUrl: string;
  files: File[];
}

export default function SubmitPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "media" | "link">("text");
  const [tabValidation, setTabValidation] = useState<TabValidation>({
    isValid: false,
    title: "",
    body: "",
    linkUrl: "",
    files: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Please log in to create a post.</p>
      </div>
    );
  }

  const canSubmit = selectedCommunity !== null && tabValidation.isValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedCommunity) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("title", tabValidation.title);
      formData.append("communityName", selectedCommunity.name);

      if (activeTab === "text") {
        formData.append("body", tabValidation.body);
      } else if (activeTab === "media") {
        formData.append("body", tabValidation.body);
        tabValidation.files.forEach((file) => {
          formData.append("media", file);
        });
      } else if (activeTab === "link") {
        formData.append("linkUrl", tabValidation.linkUrl);
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      // Success - redirect to the new post
      navigate(`/posts/${data.data._id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6">Create post</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Column */}
        <div className="space-y-4">
          {/* Community Selector */}
          <CommunityCombobox
            value={selectedCommunity}
            onChange={setSelectedCommunity}
          />

          {/* Tabs */}
          <div className="rounded-lg border bg-card">
            <SubmitTabs
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onValidationChange={setTabValidation}
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-muted-foreground text-sm">To be constructed...</p>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden mt-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-sm">To be constructed...</p>
        </div>
      </div>
    </div>
  );
}
