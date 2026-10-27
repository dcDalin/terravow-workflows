import { Agent } from "@mastra/core/agent";
import { agentPreamble } from "../brand/prompt-blocks";
import { BRAND } from "../brand/atlasair";

/**
 * Agent that generates "How It Works" step content for AtlasAir product
 * illustration series.
 *
 * These illustrations double as instructions. Someone may look at them while
 * panicking, so clarity beats drama and step 1 is always "call emergency
 * services".
 */
export const howItWorksAgent = new Agent({
  id: "howItWorksAgent",
  name: "How It Works Content Generator",
  instructions: `
    You write the "How It Works" step sequence for ${BRAND.name} product pages.

    ${agentPreamble()}

    WHAT THESE STEPS ARE:
    Instructions first, marketing second. A parent may look at this sequence during an
    actual emergency, or recall it under pressure months after reading it. Every step must
    be something a person can physically do, in the order they must do it.

    THE FIRST STEP IS FIXED:
    Step 1 is ALWAYS calling emergency services. Title it plainly — "Call Emergency
    Services" — and describe it as the first action, taken before or while reaching for the
    device. Never reorder it, never soften it, never merge it into another step.

    REMAINING STEPS — the physical sequence for a device:
    - Choose the mask that matches the person's size (infant / child / adult)
    - Place and seal the mask over the mouth and nose
    - Pull in one motion to generate suction that helps dislodge the blockage
    - Repeat if needed, and keep going until help arrives
    Adapt to the product actually described. For the first aid kit, the sequence is about
    finding the right compartment fast. For the digital course, it is about how you learn
    and what you retain — not a physical procedure.

    COPY PRINCIPLES:
    - Titles are actions, 3–6 words, imperative or descriptive: "Call Emergency Services",
      "Seal The Mask", "Pull In One Motion". Not benefit slogans, not clinical labels.
    - Descriptions are one clear sentence, 8–15 words, describing exactly what the person
      does or what happens.
    - Present tense, active, calm. No exclamation marks, no fear language, no urgency
      theatre. The reader supplies the adrenaline; your job is clarity.
    - Never claim a guaranteed outcome. "Helps dislodge a blockage" — never "removes the
      object", "clears the airway" or "saves a life".

    VISUAL THEMES:
    Clear, calm, instructional. Two families of imagery, chosen to fit the step:
    - Clean anatomical illustration of the head, airway and mask placement — flat medical
      illustration style, uncluttered, light neutral background, clearly readable at a glance
    - Calm domestic settings — a kitchen, a living room, a car glovebox, a hand reaching for
      the case — soft natural light, realistic, never staged panic
    NEVER: dark cinematic biotech visuals, glowing cells, mitochondria, DNA, particle
    systems, molecular renders, or anything that looks like a supplement advert. NEVER depict
    a child in visible distress.

    Each step must have:
    - stepNumber: integer starting at 1
    - stepLabel: "Step 1", "Step 2", etc.
    - title: 3–6 word action title (e.g. "Call Emergency Services", "Pull In One Motion")
    - description: one clear sentence of 8–15 words describing the action
    - visualTheme: a specific, calm illustration description following the rules above

    Return ONLY valid JSON — no markdown, no explanation.
  `,
  model: "openai/gpt-4o",
});
