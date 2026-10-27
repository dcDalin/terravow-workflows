import { homedir } from "os";
import { join } from "path";

/**
 * AtlasAir brand constants — the single source of truth for voice and safety
 * rules. Agents and workflow steps import from here rather than restating the
 * brand inline, so a change lands everywhere at once.
 */
export const BRAND = {
  name: "AtlasAir",
  tagline: "Life-saving first aid, ready before you need it.",
  website: "atlasair.com",
  category: "home choking-rescue and emergency-preparedness gear for families",

  /** The single moment the whole store is built around. */
  positioning:
    "The 30 seconds before help arrives. Every product exists for that window — the gap between something going wrong and a professional taking over.",

  /** The four pitch pillars. Copy should draw from these, not invent new ones. */
  pillars: [
    "Works in seconds — one pull generates suction to help dislodge a blockage. No technique to remember.",
    "No training required — a parent, grandparent or babysitter can act under pressure.",
    "For the whole household — interchangeable masks cover infants through adults.",
    "Reusable — latex-free, BPA-free, rinses clean and resets. Nothing to replace after a scare.",
  ],

  /** Must appear on every surface. Non-negotiable. */
  safetyDisclaimer:
    "AtlasAir devices are airway-clearance aids. They are not a substitute for professional medical care or emergency services.",

  /** Step one of every "how it works" sequence, without exception. */
  emergencyFirstRule:
    "Call emergency services first. The device is used while help is on the way, never instead of calling.",

  /**
   * The AtlasAir palette. A workflow run may override primary/secondary/accent
   * via the optional `brandColors` input; everything else is fixed.
   */
  palette: {
    primary: "#2477da",
    primaryHover: "#1a61b8",
    primaryPress: "#144c91",

    /** Destructive / accent. One CTA per screen — never two. */
    accent: "#ed512c",
    accentHover: "#d33e1d",

    /** Secondary button: white fill with a navy border. */
    secondary: "#ffffff",

    /** Paper background and navy ink foreground. */
    background: "#fcfaf5",
    foreground: "#22405f",

    mutedSurface: "#f6f1e8",
    mutedText: "#7c8ea0",

    success: "#2e9e63",

    pastels: {
      sky: "#dbedfb",
      mint: "#e2f0ea",
      blush: "#fbe5e1",
      lavender: "#eae7f5",
      sun: "#fbeecb",
    },
  },

  typography: {
    display: "Spectral",
    body: "Figtree",
    script: "Caveat",
  },

  shape: {
    radius: 16,
    buttons: "pill",
    /** Navy-tinted soft shadows. Never black. */
    shadow: "soft, navy-tinted (never black)",
    easing: "cubic-bezier(.22,1,.36,1)",
  },

  /**
   * Where generated assets land on disk when storageDestination is "local".
   * `||`, not `??`: an empty `ASSET_OUTPUT_ROOT=` line in .env arrives as "",
   * which would otherwise resolve against the server's working directory.
   */
  assetRoot:
    process.env.ASSET_OUTPUT_ROOT?.trim() ||
    join(homedir(), "Desktop", "AtlasAirAssets"),
} as const;

/**
 * Tone rules for every piece of generated copy. AtlasAir talks to someone who is
 * imagining the worst moment of their life — calm and concrete beats hype.
 */
export const VOICE_RULES = [
  "Calm, plain and direct. The reader is picturing a frightening moment; do not perform urgency at them.",
  "Concrete over dramatic. Describe what the product does and how, not how terrified they should feel.",
  "Second person. The reader is a parent, grandparent, babysitter or carer — any adult who might be the only one in the room.",
  "Never guarantee a medical outcome. Say 'helps dislodge a blockage', never 'clears the blockage' or 'saves your child'.",
  "Preparedness, not fear. The emotional payoff is 'it is in the drawer and I know how to use it', not 'imagine if you did nothing'.",
] as const;
