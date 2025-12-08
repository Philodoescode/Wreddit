// src/components/CreateCommunityForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";               // <-- your axios instance
import { Button } from "@/components/ui/button";

export default function CreateCommunityForm() {
  const navigate = useNavigate();

  // ----- form data -------------------------------------------------
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacyType, setPrivacyType] = useState<"public" | "restricted" | "private">("public");

  // dynamic arrays
  const [rules, setRules] = useState([{ title: "", description: "" }]);
  const [flairs, setFlairs] = useState([{ text: "", backgroundColor: "#ffffff", textColor: "#000000" }]);

  // ----- UI state --------------------------------------------------
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ----- validation (mirrors server) -------------------------------
  const nameRegex = /^[a-zA-Z0-9_-]{3,21}$/;

  // ----- helpers for rules -----------------------------------------
  const addRule = () => setRules([...rules, { title: "", description: "" }]);
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: "title" | "description", v: string) => {
    const copy = [...rules];
    copy[i][field] = v;
    setRules(copy);
  };

  // ----- helpers for flairs ----------------------------------------
  const addFlair = () => setFlairs([...flairs, { text: "", backgroundColor: "#ffffff", textColor: "#000000" }]);
  const removeFlair = (i: number) => setFlairs(flairs.filter((_, idx) => idx !== i));
  const updateFlair = (i: number, field: "text" | "backgroundColor" | "textColor", v: string) => {
    const copy = [...flairs];
    copy[i][field] = v;
    setFlairs(copy);
  };

  // ----- submit ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // client‑side checks
    if (!name || !title) return setError("Name and title are required.");
    if (!nameRegex.test(name)) return setError("Name: 3‑21 letters, numbers, _ or - only.");
    if (description.length > 500) return setError("Description max 500 characters.");

    setLoading(true);
    try {
      const payload = { name, title, description, privacyType, rules, flairs };
      const res = await api.post("/communities", payload);   // <-- uses your api.ts

      setSuccess("Community created!");
      setTimeout(() => navigate(`/r/${res.data.data.name}`), 800);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-3xl font-bold">Create a Community</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {success && <p className="mb-4 text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="myawesomecommunity"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block font-medium">Title</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="My Awesome Community"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description (optional)</label>
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Privacy */}
        <div>
          <label className="block font-medium">Privacy type</label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={privacyType}
            onChange={e => setPrivacyType(e.target.value as any)}
          >
            <option value="public">Public</option>
            <option value="restricted">Restricted</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Rules */}
        <div>
          <h2 className="mb-2 font-semibold">Rules</h2>
          {rules.map((r, i) => (
            <div key={i} className="mb-3 rounded border p-3">
              <input
                className="mb-1 w-full rounded border p-1"
                placeholder="Rule title (required)"
                value={r.title}
                onChange={e => updateRule(i, "title", e.target.value)}
              />
              <input
                className="mb-1 w-full rounded border p-1"
                placeholder="Description (optional)"
                value={r.description}
                onChange={e => updateRule(i, "description", e.target.value)}
              />
              <button type="button" className="text-sm text-red-600" onClick={() => removeRule(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="text-sm underline" onClick={addRule}>
            + Add rule
          </button>
        </div>

        {/* Flairs */}
        <div>
          <h2 className="mb-2 font-semibold">Flairs</h2>
          {flairs.map((f, i) => (
            <div key={i} className="mb-3 rounded border p-3">
              <input
                className="mb-1 w-full rounded border p-1"
                placeholder="Flair text"
                value={f.text}
                onChange={e => updateFlair(i, "text", e.target.value)}
              />
              <div className="flex gap-2">
                <label className="flex items-center gap-1">
                  Bg
                  <input
                    type="color"
                    value={f.backgroundColor}
                    onChange={e => updateFlair(i, "backgroundColor", e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-1">
                  Text
                  <input
                    type="color"
                    value={f.textColor}
                    onChange={e => updateFlair(i, "textColor", e.target.value)}
                  />
                </label>
              </div>
              <button type="button" className="mt-2 text-sm text-red-600" onClick={() => removeFlair(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="text-sm underline" onClick={addFlair}>
            + Add flair
          </button>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create Community"}
        </Button>
      </form>
    </div>
  );
}