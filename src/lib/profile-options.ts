export const avatarOptions=[
    { id: "blue", bg: "bg-blue-500" },
    { id: "green", bg: "bg-green-500" },
    { id: "red", bg: "bg-red-500" },
    { id: "purple", bg: "bg-purple-500" },
    { id: "orange", bg: "bg-orange-500" },
    { id: "pink", bg: "bg-pink-500" },
    { id: "teal", bg: "bg-teal-500" },
    { id: "indigo", bg: "bg-indigo-500" },
];


export const coverOptions = [
  { id: "sunset", gradient: "from-orange-400 via-pink-500 to-purple-600" },
  { id: "ocean", gradient: "from-cyan-400 via-blue-500 to-indigo-600" },
  { id: "forest", gradient: "from-green-400 via-emerald-500 to-teal-600" },
  { id: "night", gradient: "from-slate-700 via-slate-800 to-slate-900" },
  { id: "fire", gradient: "from-yellow-400 via-orange-500 to-red-600" },
  { id: "aurora", gradient: "from-violet-400 via-purple-500 to-fuchsia-600" },
];


export function getAvatarBg(avatarId: string | null | undefined): string {
    const found = avatarOptions.find((a) => a.id === avatarId);
    return found ? found.bg : "bg-muted";
}

export function getCoverGradient(coverId: string | null | undefined): string {
    const found = coverOptions.find((c) => c.id === coverId);
    return found ? `bg-gradient-to-r ${found.gradient}` : "bg-gradient-to-r from-slate-700 to-slate-900";
}