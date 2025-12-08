// src/components/ProfileEditForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ProfileEditFormProps {
  initialData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    userSocialLinks?: string;
  };
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
  saving?: boolean;
}

export default function ProfileEditForm({
  initialData,
  onCancel,
  onSave,
  saving = false,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    bio: initialData.bio || "",
    userSocialLinks: initialData.userSocialLinks || "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">First Name</label>
          <Input
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="First Name"
            disabled={saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name</label>
          <Input
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Last Name"
            disabled={saving}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bio</label>
        <Textarea
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
          disabled={saving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Social Link</label>
        <Input
          value={formData.userSocialLinks}
          onChange={(e) => handleChange("userSocialLinks", e.target.value)}
          placeholder="https://twitter.com/yourname"
          disabled={saving}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}