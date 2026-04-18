export type FlowCategory = "sleep" | "food" | "work" | "gym" | "mind";

export type FlowItem = {
  id: string;
  category: FlowCategory;
  timeRange: string;
  title: string;
  suggestion: string;
  details: string[];
};

const CATEGORY_IMAGE_BASE: Record<FlowCategory, string> = {
  sleep:
    "https://images.unsplash.com/photo-1581351126397-c6e51c5b2ebe?auto=format&fit=crop&w=1200&q=80",
  food:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  work:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  gym:
    "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=80",
  mind:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
};

export function getCategoryImageUrl(category: FlowCategory, seed: string): string {
  return `${CATEGORY_IMAGE_BASE[category]}&sig=${encodeURIComponent(seed)}`;
}

export const FLOW_ITEMS: FlowItem[] = [
  {
    id: "sleep-reset",
    category: "sleep",
    timeRange: "00:00 - 07:00",
    title: "Sleep & Recovery",
    suggestion: "AI tip: Keep your room cool and avoid screens for 45 minutes pre-bed.",
    details: ["Target 7h 45m", "Wind down at 22:15", "No caffeine after 15:00"],
  },
  {
    id: "morning-fuel",
    category: "food",
    timeRange: "07:30 - 08:00",
    title: "Morning Fuel",
    suggestion: "AI tip: Front-load protein and hydration for steadier energy.",
    details: ["40g protein goal", "Complex carbs", "500ml water"],
  },
  {
    id: "deep-work",
    category: "work",
    timeRange: "09:00 - 12:00",
    title: "Deep Work",
    suggestion: "AI tip: 50/10 focus blocks; one objective per block.",
    details: ["Mute distractions", "Priority sprint", "Review output at noon"],
  },
  {
    id: "strength-session",
    category: "gym",
    timeRange: "18:00 - 19:30",
    title: "Strength Session",
    suggestion: "AI tip: Compound lifts first, log RPE after each main set.",
    details: ["Progressive overload", "2-minute rests", "Post-workout mobility"],
  },
  {
    id: "mind-cooldown",
    category: "mind",
    timeRange: "21:00 - 22:00",
    title: "Mind Cooldown",
    suggestion: "AI tip: Breathwork + short journal to close cognitive loops.",
    details: ["4-7-8 breathing", "Tomorrow preview", "Low-light environment"],
  },
];
