"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { avatarOptions, coverOptions } from "@/lib/profile-options";
import { toast } from "sonner";
import { api } from "@/lib/api";

const GENRE_OPTIONS = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War",
];

interface EditProfileProps {
  userId: number;
  currentName: string;
  currentBio: string;
  currentPronouns: string;
  currentGenres: string;
  currentAvatarId: string | null;
  currentCoverId: string | null;
  onSave: (data: {
    name?: string;
    bio?: string;
    pronouns?: string;
    favorite_genres?: string;
    avatar_id?: string;
    cover_id?: string;
  }) => void;
}

export function EditProfileDialog({
  userId,
  currentName,
  currentBio,
  currentPronouns,
  currentGenres,
  currentAvatarId,
  currentCoverId,
  onSave,
}: EditProfileProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [pronouns, setPronouns] = useState(currentPronouns);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    currentGenres ? currentGenres.split(",").map((g) => g.trim()) : []
  );
  const [avatarId, setAvatarId] = useState(currentAvatarId || "");
  const [coverId, setCoverId] = useState(currentCoverId || "");

  function toggleGenre(genre: string) {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  }

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setName(currentName);
      setBio(currentBio);
      setPronouns(currentPronouns);
      setSelectedGenres(currentGenres ? currentGenres.split(",").map((g) => g.trim()) : []);
      setAvatarId(currentAvatarId || "");
      setCoverId(currentCoverId || "");
    }
    setOpen(isOpen);
  }

  async function handleSave() {
    const data: Record<string, string> = {};
    const normalizedName = name.trim();
    const normalizedBio = bio.trim();
    const normalizedPronouns = pronouns.trim();
    const genresStr = selectedGenres.join(", ");

    if (normalizedName !== currentName) data.name = normalizedName;
    if (normalizedBio !== currentBio) data.bio = normalizedBio;
    if (normalizedPronouns !== currentPronouns) data.pronouns = normalizedPronouns;
    if (genresStr !== currentGenres) data.favorite_genres = genresStr;
    if (avatarId !== (currentAvatarId || "")) data.avatar_id = avatarId;
    if (coverId !== (currentCoverId || "")) data.cover_id = coverId;

    if (Object.keys(data).length === 0) {
      setOpen(false);
      return;
    }

    try {
      const resp = await api.patch(`/v1/users/${userId}`, data);
      onSave({
        name: resp.data?.name,
        bio: resp.data?.bio ?? "",
        pronouns: resp.data?.pronouns ?? "",
        favorite_genres: resp.data?.favorite_genres ?? "",
        avatar_id: resp.data?.avatar_id ?? "",
        cover_id: resp.data?.cover_id ?? "",
      });
      toast.success("Profile updated!");
      setOpen(false);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 422) {
        toast.error("Invalid profile data. Check name/bio and try again.");
        return;
      }
      toast.error("Error updating profile.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1 transition-colors">
          Edit Profile
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">

          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
              maxLength={50}
            />
          </div>

          {/* Pronouns */}
          <div>
            <label className="text-sm font-medium">Pronouns</label>
            <select
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select...</option>
              <option value="he/him">he/him</option>
              <option value="she/her">she/her</option>
              <option value="they/them">they/them</option>
              <option value="prefer not to say">prefer not to say</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm min-h-20"
              placeholder="Tell us about yourself..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
          </div>

          {/* Favorite Genres */}
          <div>
            <label className="text-sm font-medium">Favorite Genres <span className="text-muted-foreground font-normal">(max 5)</span></label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GENRE_OPTIONS.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedGenres.includes(genre)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="text-sm font-medium">Avatar Color</label>
            <div className="flex gap-3 mt-2">
              {avatarOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatarId(opt.id)}
                  className={`w-10 h-10 rounded-full ${opt.bg} hover:scale-110 transition-transform ${
                    opt.id === avatarId ? "ring-3 ring-primary ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Cover */}
          <div>
            <label className="text-sm font-medium">Cover</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {coverOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCoverId(opt.id)}
                  className={`h-14 rounded-lg bg-gradient-to-r ${opt.gradient} hover:scale-105 transition-transform ${
                    opt.id === coverId ? "ring-3 ring-primary ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}