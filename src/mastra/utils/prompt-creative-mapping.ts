import { existsSync } from "fs";
import { join } from "path";

/**
 * Type definitions for template prompts and ad creatives
 */

export interface TemplatePrompt {
  id: number;
  name: string;
  category: string;
  aspectRatio: "1:1" | "4:5" | "9:16";
  tags: string[];
  promptText: string;
}

export interface AdCreative {
  fileName: string;
  path: string;
}

export interface PromptCreativeMapping {
  prompt: TemplatePrompt;
  creative: AdCreative;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Complete mapping of all 40 template prompts to their respective ad creatives
 */
export const PROMPT_CREATIVE_MAPPINGS: PromptCreativeMapping[] = [
  {
    prompt: {
      id: 1,
      name: "Headline",
      category: "Text Rendering",
      aspectRatio: "4:5",
      tags: ["headline", "copy", "text", "static"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product colors, typography style, and brand tone precisely.
        Create: a static ad with a [BACKGROUND] background.
        Top third: large bold sans-serif headline reading "[YOUR HEADLINE, under 10 words]".
        Below in smaller text: "[YOUR SUBHEAD, one sentence]".
        Bottom half: [YOUR PRODUCT] on the surface with [DETAILS].
        Shot at 50mm f/2.8 from slightly above.
        [BRAND] logo bottom right.
        Clean, authoritative.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "headline.webp",
      path: "src/mastra/assets/AdCreatives/headline.webp",
    },
  },
  {
    prompt: {
      id: 2,
      name: "Offer/Promotion",
      category: "Promotional",
      aspectRatio: "9:16",
      tags: ["offer", "promotion", "deal", "cta"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match exact brand colors and typography style.
        Create: a promotional ad with a split background.
        Top 60% is [PRIMARY BRAND COLOR] and bottom 40% is [CONTRAST COLOR — e.g. warm cream].
        [YOUR PRODUCT] sits centered where colors meet, soft studio lighting.
        Upper area: large [CONTRAST TEXT] sans-serif reading "[YOUR OFFER — e.g. YOUR FIRST MONTH FREE]".
        Below: "[OFFER DETAILS]".
        Lower section: small [BRAND COLOR] text with [VALUE ADDS].
        [BRAND] logo bottom right.
        9:16 aspect ratio.
      `,
    },
    creative: {
      fileName: "offer-promotion.webp",
      path: "src/mastra/assets/AdCreatives/offer-promotion.webp",
    },
  },
  {
    prompt: {
      id: 3,
      name: "Testimonials",
      category: "Social Proof",
      aspectRatio: "9:16",
      tags: ["testimonial", "quote", "review", "environment"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a testimonial ad set in [SETTING — e.g. bright bathroom / kitchen] with warm natural light.
        [YOUR PRODUCT] on [SURFACE], slightly out of focus.
        Overlaid: large bold white sans-serif "[SHORT HEADLINE]".
        Below: "[FULL QUOTE 2-3 sentences]. [NAME], [CREDENTIAL]."
        Five filled [BRAND COLOR] stars.
        [BRAND] logo bottom right in white.
        Shot on 35mm f/2.0.
        9:16 aspect ratio.
      `,
    },
    creative: {
      fileName: "testimonials.webp",
      path: "src/mastra/assets/AdCreatives/testimonials.webp",
    },
  },
  {
    prompt: {
      id: 4,
      name: "Features/Benefits Point-Out",
      category: "Educational",
      aspectRatio: "4:5",
      tags: ["features", "benefits", "diagram", "educational"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: an educational diagram-style ad on white background.
        Top: bold [BRAND COLOR] text "[HEADER — e.g. "What Makes This Product Different"]".
        Below: [YOUR PRODUCT] centered, even studio lighting.
        Four callout boxes with connecting lines: "[BENEFIT 1-4]".
        Each has a small [BRAND COLOR] circle.
        If a brand website URL is provided, display it in small text bottom center; otherwise omit this element.
        [BRAND] logo bottom right.
        Scientific diagram redesigned by a luxury agency.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "features-benefits-point-out.webp",
      path: "src/mastra/assets/AdCreatives/features-benefits-point-out.webp",
    },
  },
  {
    prompt: {
      id: 5,
      name: "Bullet-Points",
      category: "Educational",
      aspectRatio: "4:5",
      tags: ["benefits", "list", "split-layout", "bullets"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a benefit-list ad, split composition on [BACKGROUND] background.
        Left 40%: [YOUR PRODUCT] on [SURFACE], shot at 85mm f/2.8.
        Right 60%: vertical stack of five lines with filled [BRAND COLOR] circles: "[BENEFIT 1-5]".
        Clean sans-serif, generous spacing.
        [BRAND] logo bottom right.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "bullet-points.webp",
      path: "src/mastra/assets/AdCreatives/bullet-points.webp",
    },
  },
  {
    prompt: {
      id: 6,
      name: "Social Proof",
      category: "Trust Building",
      aspectRatio: "4:5",
      tags: ["social-proof", "reviews", "press", "trust"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a social proof ad on [BACKGROUND — e.g. warm cream].
        Top: "[HEADLINE — e.g. Join 1,000,000+ Members]" in bold [BRAND COLOR].
        Five filled stars with "Rated [X] out of 5".
        Center: [YOUR PRODUCT] at 50mm f/4.
        Below: frosted white card with five-star rating, "[REVIEW TITLE]", "[2-3 SENTENCE REVIEW]", "[ATTRIBUTION]" in italic.
        Below card: "As Featured In" with five grayscale logos.
        [BRAND] logo bottom right.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "social-proof.webp",
      path: "src/mastra/assets/AdCreatives/social-proof.webp",
    },
  },
  {
    prompt: {
      id: 7,
      name: "Us vs Them",
      category: "Comparison",
      aspectRatio: "4:5",
      tags: ["comparison", "vs", "competitor", "side-by-side"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a side-by-side divided vertically.
        Left: muted gray-blue background.
        Right: [PRIMARY BRAND COLOR].
        Center top: white circle with "VS".
        Left header: "[COMPETITOR CATEGORY]" + generic competitor product + list with X marks: "[WEAKNESS 1-5]".
        Right header: "[YOUR BRAND]" + [YOUR PRODUCT] + list with checkmarks: "[STRENGTH 1-5]".
        [BRAND] logo bottom right.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "us-vs-them.webp",
      path: "src/mastra/assets/AdCreatives/us-vs-them.webp",
    },
  },
  {
    prompt: {
      id: 8,
      name: "Before & After (UGC Native)",
      category: "UGC",
      aspectRatio: "9:16",
      tags: ["before-after", "ugc", "transformation", "native"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for product color ONLY. This should look like a real person's post.
        Create: TikTok before-and-after.
        LEFT: grainy iPhone mirror selfie, [PERSON] in dimly lit bathroom, [BEFORE STATE], harsh lighting. White handwritten text: "[BEFORE DATE]".
        RIGHT: same person, same bathroom, bright natural light, [AFTER STATE], [PRODUCT] visible on counter. White text: "[AFTER DATE]".
        Top center: "[TIMEFRAME] on [BRAND]" with emoji.
        Should look stitched in CapCut.
        9:16 aspect ratio.
      `,
    },
    creative: {
      fileName: "before-and-after-ugc-native.webp",
      path: "src/mastra/assets/AdCreatives/before-and-after-ugc-native.webp",
    },
  },
  {
    prompt: {
      id: 9,
      name: "Negative Marketing (Bait & Switch)",
      category: "Hook",
      aspectRatio: "4:5",
      tags: ["negative-marketing", "bait-switch", "hook", "scroll-stop"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: Background is close-up of [PRODUCT], slightly blurred.
        Center: white rounded-rectangle review card (Amazon-style).
        Gray user icon, "[NAME]", one gold star + four gray, orange "Verified Purchase" badge, bold text: "[BAIT that sounds negative but is positive]".
        Bottom: bold white sans-serif "[PUNCHLINE — e.g. THE REVIEWS ARE IN.]".
        [BRAND] logo bottom right.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "negative-marketing-bait-and-switch.webp",
      path: "src/mastra/assets/AdCreatives/negative-marketing-bait-and-switch.webp",
    },
  },
  {
    prompt: {
      id: 10,
      name: "Press/Editorial",
      category: "Authority",
      aspectRatio: "4:5",
      tags: ["press", "editorial", "authority", "publications"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a press ad on off-white linen background.
        Top: "As Featured In" in small [BRAND COLOR] uppercase wide-tracked text.
        Below: five grayscale publication logos.
        Center: italic serif pull-quote in [BRAND COLOR]: "[PRESS QUOTE]" with attribution.
        Lower third: [PRODUCT] at 85mm f/2.8, soft side light.
        [BRAND] logo bottom left.
        Generous white space.
        Full-page Vogue energy.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "press-editorial.webp",
      path: "src/mastra/assets/AdCreatives/press-editorial.webp",
    },
  },
  {
    prompt: {
      id: 11,
      name: "Pull-Quote Review Card",
      category: "Social Proof",
      aspectRatio: "1:1",
      tags: ["review", "quote", "card", "emotional"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product colors and brand tone precisely.
        Create: a review-driven ad with a solid [BRAND COLOR with hex — a soft, muted tone works best] color block background filling the entire image.
        Top half: large bold italic serif text in white with curly quotation marks reading "[PULL-QUOTE — the most emotional 4-8 word phrase from the review, e.g., "I finally found something that works!"]".
        Directly below the quote: five large filled gold/yellow star icons in a horizontal row.
        Bottom left, overlapping the color background: a white rounded-corner review card with subtle shadow, containing: a small gray circular default avatar icon, beside it "[FIRST NAME + LAST INITIAL]" in bold dark sans-serif with a small [FLAG EMOJI matching target market — e.g., 🇺🇸], below the name a blue checkmark icon with "[VERIFIED REVIEWER / VERIFIED BUYER]" in small blue text.
        Below the reviewer info: the review body text in medium-weight dark sans-serif, 4-6 lines of authentic-sounding customer voice that trails off mid-sentence, ending with "...Read more" in bold [BRAND COLOR] text — the truncation is intentional to create curiosity.
        Below the review text: "Was this review helpful?" in small gray text with a thumbs-up icon and "[HELPFULNESS COUNT — e.g., 150 / 2.4K]" beside it.
        Bottom right, overlapping both the card and the color background: [YOUR PRODUCT — full packaging description] angled slightly toward the viewer, sitting on the color block surface with a subtle shadow beneath.
        No brand logo needed if the product packaging already shows it — the review card IS the social proof.
        1:1 or 4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "pull-quote-review-card.webp",
      path: "src/mastra/assets/AdCreatives/pull-quote-review-card.webp",
    },
  },
  {
    prompt: {
      id: 12,
      name: "Lifestyle Action + Product Colorway Array",
      category: "Lifestyle",
      aspectRatio: "1:1",
      tags: ["lifestyle", "action", "product-array", "variants"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and visual tone precisely.
        Create: a static ad with a [LIFESTYLE PHOTO DESCRIPTION — e.g. man mid-golf-swing in tropical patterned polo and khaki pants] occupying the left two-thirds of the frame, shot outdoors in [SETTING — e.g. golf course with palm trees], bright natural daylight.
        [BRAND] logo top center in bold.
        Below logo: large bold sans-serif quote text reading "[ENDORSEMENT HEADLINE — e.g. THE GREATEST PANTS IN GOLF]" in [TEXT COLOR — e.g. white or black].
        Bottom right foreground: three [PRODUCT VARIANTS — e.g. folded pairs of shorts/pants] fanned in an overlapping arrangement showing [COLOR 1], [COLOR 2], and [COLOR 3].
        Products are crisp and studio-lit against the lifestyle background.
        Shot on 50mm f/2.0, lifestyle background slightly softer than foreground product.
        [MOOD — e.g. confident, athletic, aspirational but accessible].
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "lifestyle-action-product-colorway-array.webp",
      path: "src/mastra/assets/AdCreatives/lifestyle-action-product-colorway-array.webp",
    },
  },
  {
    prompt: {
      id: 13,
      name: "Stat Surround / Callout Radial (Product Hero)",
      category: "Data-Driven",
      aspectRatio: "1:1",
      tags: ["stats", "callout", "radial", "product-hero"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a white-to-[LIGHT GRADIENT COLOR — e.g. warm golden beige] gradient background, gradient fading from top to bottom.
        Top: large bold [TEXT COLOR — e.g. dark brown] sans-serif headline reading "[HEADLINE — e.g. So tasty you'll forget it's actually healthy.]"
        Center: [YOUR PRODUCT — e.g. single stand-up pouch] on white background, soft studio lighting.
        Floating near the product: a small circular badge reading "[PRICE POINT — e.g. AS LOW AS $2.63 PER MEAL!]" in [BADGE COLOR].
        Flanking the product on both sides: four stat callouts with curved arrows pointing toward the product.
        Left side top: "[STAT 1 — e.g. 20g]" in oversized bold text with "[LABEL — e.g. PROTEIN]" below.
        Left side bottom: "[STAT 2 — e.g. 280]" with "[LABEL — e.g. CALORIES]".
        Right side top: "[STAT 3 — e.g. 900k+]" with "[LABEL — e.g. HAPPY CUSTOMERS]".
        Right side bottom: "[STAT 4 — e.g. 30k+]" with "[LABEL — e.g. 5-STAR REVIEWS]" and five filled gold stars beneath.
        Arrows are simple hand-drawn-style curved lines in [ARROW COLOR — e.g. black].
        Bottom foreground: [FLAVOR PROPS — e.g. scattered chocolate chip cookie dough balls and chocolate chips] adding appetite appeal.
        No brand logo.
        Clean, informational, appetizing.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "stat-surround-callout-radial-product-hero.webp",
      path: "src/mastra/assets/AdCreatives/stat-surround-callout-radial-product-hero.webp",
    },
  },
  {
    prompt: {
      id: 14,
      name: "Bundle Showcase + Benefit Bar",
      category: "Product Showcase",
      aspectRatio: "1:1",
      tags: ["bundle", "system", "benefits", "showcase"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a [BACKGROUND — e.g. soft pink-to-hot-pink gradient] background.
        Top: oversized bold white all-caps sans-serif headline reading "[HEADLINE — e.g. 24/7 PEAK FEMALE PERFORMANCE]".
        Below headline: a horizontal [ACCENT COLOR — e.g. purple/violet] banner bar divided into [NUMBER — e.g. five] equal segments separated by thin vertical lines, each containing a two-word benefit label in white text: "[BENEFIT 1 — e.g. Morning Energy]", "[BENEFIT 2 — e.g. Focus Amplifier]", "[BENEFIT 3 — e.g. Deep Sleep]", "[BENEFIT 4 — e.g. Ultimate Beauty]", "[BENEFIT 5 — e.g. Metabolism Booster]".
        Center-to-bottom: an open [PACKAGING — e.g. branded gift box] photographed at a slight overhead angle showing [NUMBER — e.g. three] [PRODUCTS — e.g. supplement jars] nestled inside, each a different [COLOR-CODED VARIANT].
        In the lower foreground: a [LIFESTYLE PROP — e.g. woman's hand holding a pastel dumbbell] entering the frame from bottom.
        [BRAND] logo bottom left corner.
        Bright studio lighting, saturated color, energetic and empowering.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "bundle-showcase-benefit-bar.webp",
      path: "src/mastra/assets/AdCreatives/bundle-showcase-benefit-bar.webp",
    },
  },
  {
    prompt: {
      id: 15,
      name: "Social Comment Screenshot + Product",
      category: "Social Proof",
      aspectRatio: "1:1",
      tags: ["social", "comment", "screenshot", "organic"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and colors precisely.
        Create: a static ad on a clean white background.
        Top: oversized bold black sans-serif headline reading "[HOOK HEADLINE — e.g. IF YOU'RE GOING THROUGH PERI..]" with [EMOJI — e.g. 😅] at the end.
        Center: a social media comment card with light gray rounded-rectangle background containing: a small circular profile avatar (top left), bold name "[REVIEWER NAME — e.g. Elaine McLean]", and a multi-sentence review in regular-weight sans-serif: "[FULL REVIEW TEXT, 3-4 sentences, conversational and emotional]".
        Small gray timestamp "[TIMESTAMP — e.g. 2d]" below the comment.
        Bottom center: [YOUR PRODUCT — e.g. product box and bar/bottle] photographed at a slight angle on white, soft studio lighting.
        No brand logo.
        No stars.
        The rawness is the point — this should look like someone screenshotted a real comment and dropped the product photo below it.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "social-comment-screenshot-product.webp",
      path: "src/mastra/assets/AdCreatives/social-comment-screenshot-product.webp",
    },
  },
  {
    prompt: {
      id: 16,
      name: "Curiosity Gap / Hook Quote Testimonial",
      category: "Hook",
      aspectRatio: "1:1",
      tags: ["curiosity", "hook", "testimonial", "provocative"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a clean white background.
        Top center: large [ACCENT COLOR — e.g. periwinkle blue] opening quotation marks.
        Below: mixed-weight headline in black — the first line in italic serif or semi-bold reading "[SETUP LINE — e.g. I've been]", the next two lines in enormous heavy-weight bold all-caps sans-serif reading "[BAIT PHRASE — e.g. FAKING IT / WITH MY HUSBAND]", followed by a smaller sentence-case line reading "[REVEAL — e.g. since perimenopause — with the brand I don't have to]".
        Closing quotation marks and "[ATTRIBUTION — e.g. - Erin D.]" in regular weight.
        Left side bottom third: [YOUR PRODUCT — e.g. supplement bottle] at a slight angle with [PRODUCT DETAILS — e.g. capsules scattered nearby].
        To the left of the product: a [TRUST BADGE — e.g. circular seal reading "Happiness 60 DAY Guaranteed"].
        Right side bottom third: [NUMBER — e.g. five] filled [ACCENT COLOR] stars and bold text reading "[REVIEW COUNT — e.g. 3,600+] 5-Star Reviews" with a [BRAND ICON].
        Bottom edge: small disclaimer text "[DISCLAIMER — e.g. Results may vary based on individual. No results guaranteed.]"
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "curiosity-gap-hook-quote-testimonial.webp",
      path: "src/mastra/assets/AdCreatives/curiosity-gap-hook-quote-testimonial.webp",
    },
  },
  {
    prompt: {
      id: 17,
      name: "Verified Review Card",
      category: "Social Proof",
      aspectRatio: "1:1",
      tags: ["review", "verified", "card", "trust"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a solid [BRAND COLOR — e.g. periwinkle/lavender blue] background.
        Top: large bold white serif or semi-bold sans-serif pull-quote reading "[HEADLINE QUOTE — e.g. "I finally found something that works!"]" in quotation marks.
        Below the quote: five filled gold stars, large.
        Center-left: a white rounded-rectangle review card with subtle shadow containing: gray circular avatar icon, bold name "[REVIEWER NAME — e.g. Dawn K.]" with [FLAG EMOJI — e.g. 🇺🇸], blue checkmark and "[VERIFIED BADGE TEXT — e.g. Verified Reviewer]" in [BRAND COLOR] text, then 3-4 sentences of review body text in regular weight dark text.
        At the bottom of the card: a blue "[READ MORE — e.g. ...Read more]" link and "[HELPFULNESS — e.g. Was this review helpful? 👍 150]".
        Right side, overlapping the card edge: [YOUR PRODUCT — e.g. cream jar with lid] photographed at a slight angle, soft studio lighting, casting a gentle shadow on the background.
        No brand logo.
        The review UI is the trust mechanic.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "verified-review-card.webp",
      path: "src/mastra/assets/AdCreatives/verified-review-card.webp",
    },
  },
  {
    prompt: {
      id: 18,
      name: "Stat Surround / Callout Radial (Lifestyle Flatlay)",
      category: "Data-Driven",
      aspectRatio: "1:1",
      tags: ["stats", "callout", "lifestyle", "flatlay"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a white background with a lifestyle flatlay arrangement.
        Top: bold [ACCENT COLOR — e.g. purple] filled banner bar spanning full width, white all-caps sans-serif reading "[HEADLINE — e.g. INCREDIBLY TASTY BREAKFAST IN 30 SECONDS]".
        Center: a [PERSON DETAIL — e.g. woman's hand] holding [YOUR PRODUCT — e.g. branded shaker cup] in mid-frame.
        Scattered around the edges: [FLATLAY PROPS — e.g. product sachets, pancakes on plates, blueberries, muffins, fruit] arranged organically to fill corners and edges, slightly out of focus.
        Four stat callouts with curved [ACCENT COLOR] arrows pointing toward the held product: "[STAT 1 — e.g. 20g] / [LABEL — e.g. PROTEIN]", "[STAT 2 — e.g. 900K] / [LABEL — e.g. HAPPY CUSTOMERS]", "[STAT 3 — e.g. 20+] / [LABEL — e.g. FLAVORS]", "[STAT 4 — e.g. 30K] / [LABEL — e.g. 5 STAR REVIEWS]" with five small gold stars.
        Stats in bold black, labels in all-caps regular weight.
        Bright, flat studio lighting.
        Energetic, appetizing, information-dense but scannable.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "stat-surround-callout-radial-lifestyle-flatlay.webp",
      path: "src/mastra/assets/AdCreatives/stat-surround-callout-radial-lifestyle-flatlay.webp",
    },
  },
  {
    prompt: {
      id: 19,
      name: "Highlighted / Annotated Testimonial",
      category: "Social Proof",
      aspectRatio: "1:1",
      tags: ["testimonial", "highlighted", "annotated", "long-form"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and typography style precisely.
        Create: a static ad on a clean white background.
        Top left: circular customer headshot photo of [PERSON DESCRIPTION — e.g. smiling woman, mid-60s, silver wavy hair, wearing blue top].
        To the right of the photo: bold name "[REVIEWER NAME — e.g. Veronica B.]" with a [VERIFIED ICON — e.g. blue checkmark].
        Below: a long-form customer quote in large regular-weight black sans-serif type spanning most of the frame: "[FULL QUOTE, 3-5 sentences]".
        Key phrases within the quote are highlighted with [HIGHLIGHT COLOR — e.g. bright lime green / neon yellow] rectangular background fills behind the text: "[HIGHLIGHTED PHRASE 1 — e.g. thyroid removed]", "[HIGHLIGHTED PHRASE 2 — e.g. This is the best product I have found.]"
        Bottom right: [YOUR PRODUCT — e.g. supplement jar] at a slight angle, partially cropped at the bottom edge.
        To the left of the product: a circular [TRUST BADGE — e.g. "100% MONEY BACK / 90 DAYS / 100% GUARANTEE"] seal in [BADGE COLOR — e.g. lime green with dark text].
        [BRAND] logo bottom left corner, small.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "highlighted-annotated-testimonial.webp",
      path: "src/mastra/assets/AdCreatives/highlighted-annotated-testimonial.webp",
    },
  },
  {
    prompt: {
      id: 20,
      name: "Advertorial / Editorial Content Card",
      category: "Native",
      aspectRatio: "4:5",
      tags: ["advertorial", "editorial", "native", "organic"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for tone ONLY. Do NOT use polished ad layouts. This should look like organic editorial content.
        Create: a full-bleed moody portrait photo of [PERSON DESCRIPTION — e.g. young man in dark textured sweater holding an electric guitar], warm amber-toned lighting, shot on 50mm f/1.8, shallow depth of field, cinematic color grade with warm highlights and cool shadows.
        Lower 45% of the frame is a text overlay zone: a prominent white rounded-rectangle pill label reading "[CATEGORY TAG — e.g. HOT TOPIC]" in centered uppercase sans-serif, sized to span roughly one-third of the frame width.
        Below: very large, dominant, bold all-caps condensed sans-serif headline filling the width of the frame in white text with key words in [HIGHLIGHT COLOR]: "[HEADLINE — e.g. THIS BRAND IS BLOWING UP ON TIKTOK — HERE'S WHY EVERYONE'S USING IT TO IMPROVE THEIR ROUTINE]".
        The headline should be oversized — at least 35% of the total frame height.
        Bottom center: "[@HANDLE — e.g. @waveform.watch]" in small white text.
        No product shot, no CTA button, no stars.
        This should read like a music blog or culture account post, not a paid ad.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "advertorial-editorial-content-card.webp",
      path: "src/mastra/assets/AdCreatives/advertorial-editorial-content-card.webp",
    },
  },
  {
    prompt: {
      id: 21,
      name: "Bold Statement / Reaction Headline",
      category: "Brand Energy",
      aspectRatio: "1:1",
      tags: ["bold", "statement", "brand", "provocative"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and visual tone precisely.
        Create: a static ad on a vibrant [GRADIENT — e.g. coral-pink to golden-yellow] gradient background, flowing diagonally from upper left to lower right.
        Upper left: oversized playful [FONT STYLE — e.g. rounded retro serif / Cooper Black style] white headline reading "[BOLD STATEMENT — e.g. This popcorn is so f*****g delicious.]" — text should feel loose, fun, and expressive, not rigid or corporate.
        Right side: [PERSON DETAIL — e.g. a hand reaching down from upper right] grabbing from [YOUR PRODUCT — e.g. the signature bright yellow popper bowl overflowing with fluffy popcorn].
        Product sits center-right, slightly below midline.
        Bottom left: [BRAND] logo in [LOGO COLOR — e.g. black] with "[PRODUCT DESCRIPTOR — e.g. Flavor Wrapped Popcorn Kernels]" in smaller text below.
        No stats, no reviews, no badges.
        The gradient and the headline do all the work.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "bold-statement-reaction-headline.webp",
      path: "src/mastra/assets/AdCreatives/bold-statement-reaction-headline.webp",
    },
  },
  {
    prompt: {
      id: 22,
      name: 'Flavor Story / "Tastes Like"',
      category: "Product Appeal",
      aspectRatio: "1:1",
      tags: ["flavor", "taste", "food", "sensory"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, colors, and packaging precisely.
        Create: a flavor-visualization ad.
        Full background is a photorealistic close-up food scene of [INDULGENT FOOD — e.g. freshly baked raspberry donuts dusted with powdered sugar on a gray stone surface].
        Shot at 50mm f/2.8, shallow depth of field, warm bakery lighting.
        Top third: large bold white sans-serif headline reading "[HEADLINE — e.g. A protein bar that tastes like freshly baked raspberry donuts]" with one key word in bold italic for emphasis.
        [YOUR PRODUCT] packaged unit placed bottom-right, angled 15° as if casually laid into the scene.
        Bottom: semi-transparent white bar spanning full width with three stat columns separated by thin vertical lines: "[STAT 1 — e.g. 15g PROTEIN]" | "[STAT 2 — e.g. 2g SUGAR]" | "[STAT 3 — e.g. 180 CALORIES]".
        Very bottom edge: smaller bold sans-serif "[CLEAN LABEL CLAIM — e.g. NO ARTIFICIAL SWEETENERS]".
        Food is the hero — product is the payoff.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "flavor-story-tastes-like.webp",
      path: "src/mastra/assets/AdCreatives/flavor-story-tastes-like.webp",
    },
  },
  {
    prompt: {
      id: 23,
      name: "Long-Form Manifesto / Letter Ad",
      category: "Copy-Driven",
      aspectRatio: "1:1",
      tags: ["manifesto", "copy", "long-form", "persuasive"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match exact brand typography style and tone.
        Create: a copy-dominant manifesto ad on a clean white background.
        No background imagery — text is the entire creative.
        Top: oversized bold black serif or sans-serif headline reading "[PROVOCATIVE HEADLINE — e.g. They're not cheap.]" spanning the top 15%.
        Below: left-aligned body copy in smaller regular-weight black text, structured as short punchy sentences and line breaks (NOT paragraphs), building a persuasive argument about [CORE BRAND TENSION — e.g. why the price is justified].
        The copy should flow through: acknowledging the objection, listing what you'd lose if they cut corners, reframing as a positive, closing with a confident brand statement.
        Approximately [12-18 LINES] of copy.
        Bottom 20%: [YOUR PRODUCT] centered or slightly right, product-only on white, clean studio shot angle.
        No icons, no badges, no CTA button.
        The writing IS the ad.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "long-form-manifesto-letter-ad.webp",
      path: "src/mastra/assets/AdCreatives/long-form-manifesto-letter-ad.webp",
    },
  },
  {
    prompt: {
      id: 24,
      name: "Product + Comment Callout (Faux Social Proof)",
      category: "Social Proof",
      aspectRatio: "1:1",
      tags: ["product", "comment", "social", "organic"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and packaging precisely.
        Create: a social proof ad.
        Top 55%: [YOUR PRODUCT] centered on a clean white background, studio-lit, shot at 85mm f/2.8 with soft shadow.
        Product cap/lid slightly open or [DETAIL showing use].
        A few [LOOSE UNITS — e.g. gummies / capsules] spilling casually at the base.
        Bottom 45%: a realistic Facebook-style comment card.
        Left: small circular profile photo of [PERSON DESCRIPTION — e.g. a man in his 30s, friendly smile, casual].
        Bold name "[FIRST NAME + LAST INITIAL — e.g. Alan R.]" above the comment.
        Comment text in regular weight: "[TESTIMONIAL 2-3 sentences touching on a specific problem and the product being a game-changer]".
        Below comment: "[TIMEFRAME — e.g. 4w]" · Like · Reply in gray.
        Bottom right of comment: Facebook-style reaction emojis (thumbs up + heart) with "[COUNT — e.g. 33]".
        Should look like an organic screenshot, not designed.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "product-comment-callout-faux-social-proof.webp",
      path: "src/mastra/assets/AdCreatives/product-comment-callout-faux-social-proof.webp",
    },
  },
  {
    prompt: {
      id: 25,
      name: "Us vs. Them Color Split",
      category: "Comparison",
      aspectRatio: "1:1",
      tags: ["comparison", "vs", "split", "color-block"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and colors precisely.
        Create: a side-by-side comparison ad divided vertically into two equal halves.
        Left half: [PRIMARY BRAND COLOR — e.g. vibrant teal] background. [YOUR PRODUCT] photographed with dynamic energy — [ACTION DETAIL — e.g. chocolate dripping / liquid pouring] to convey indulgence.
        Brand logo in bold white upper-left.
        Below product: vertical stack of 4 benefits, each with a green circle checkmark emoji: "[STRENGTH 1-4 — e.g. ≤2G SUGAR / ALL NATURAL INGREDIENTS / ≥6G FIBRE / 12G PROTEIN]" in bold white uppercase.
        Right half: [CONTRAST COLOR — e.g. pale cream/beige] background. Generic unbranded competitor product [DESCRIPTION — e.g. crumpled foil-wrapped chocolate bar].
        Header: "[COMPETITOR CATEGORY — e.g. Other chocolate bars]" in dark text.
        Below: vertical stack of 4 weaknesses, each with a red circle X emoji: "[WEAKNESS 1-4 — e.g. 29G SUGAR / FULL OF FRUCTOSE CORN SYRUP / 1G FIBRE / 2G PROTEIN]" in bold dark uppercase.
        Center divider: a comic-style "VS" burst graphic in [ACCENT COLOR — e.g. coral/red].
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "us-vs-them-color-split.webp",
      path: "src/mastra/assets/AdCreatives/us-vs-them-color-split.webp",
    },
  },
  {
    prompt: {
      id: 26,
      name: "Stat Callout (Data-Driven Lifestyle)",
      category: "Data-Driven",
      aspectRatio: "4:5",
      tags: ["stats", "data", "lifestyle", "results"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match exact brand colors and typography.
        Create: a statistic-led ad.
        Top 50%: lifestyle product photography — [SCENE — e.g. a woman's hands holding the product pad / person using the product in context] on a [MOOD — e.g. warm, skin-toned, soft-focus] background.
        Product packaging visible in frame.
        Middle: brand logo centered with thin horizontal rules on either side as a visual divider.
        Bottom 50%: dark gradient overlay (fading from transparent to [DARK COLOR — e.g. deep brown/black]).
        Large bold uppercase sans-serif text: "[STAT-DRIVEN HEADLINE — e.g. AFTER SWITCHING TO THIS BRAND, X% OF USERS SAW RESULTS, WHILE Y% REPORTED A SECOND BENEFIT]."
        Key result phrases highlighted in [ACCENT COLOR — e.g. soft pink / brand secondary color].
        The statistic IS the headline — no separate subhead needed.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "stat-callout-data-driven-lifestyle.webp",
      path: "src/mastra/assets/AdCreatives/stat-callout-data-driven-lifestyle.webp",
    },
  },
  {
    prompt: {
      id: 27,
      name: "Benefit Checklist Showcase (Split Product + Info)",
      category: "Product Showcase",
      aspectRatio: "1:1",
      tags: ["benefits", "checklist", "split", "info"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and brand colors precisely.
        Create: an information-dense benefit ad, split composition.
        Left 45%: overhead product shot — [PRODUCT DISPLAY DESCRIPTION — e.g. a white bowl filled with fresh dog food divided into labeled sections by thin white lines, each section labeled in curved white text with variety names such as CHICKEN & YAMS / BEEF N' RICE / SALMON N' RICE / TURKEY & YAMS].
        Shot on 50mm f/4, clean white surface.
        Right 55%: white background.
        Top: [STAR RATING — e.g. five gold stars] with "[REVIEW COUNT — e.g. 10,000+ REVIEWS]" in [BRAND COLOR].
        Brand logo.
        Below: [BRAND COLOR] serif or sans-serif headline: "[HEADLINE — e.g. Made for the pickiest dogs]".
        Then 3 checkmark benefit rows, each with a filled [BRAND COLOR] circle checkmark + bold text: "[BENEFIT 1-3 — e.g. Head turning aroma / No additives, flavors, or preservatives / Ready to serve from the pouch]".
        Bottom right: large rounded [ACCENT COLOR] CTA button reading "[CTA — e.g. SHOP NOW]".
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "benefit-checklist-showcase-split-product-info.webp",
      path: "src/mastra/assets/AdCreatives/benefit-checklist-showcase-split-product-info.webp",
    },
  },
  {
    prompt: {
      id: 28,
      name: "Feature Arrow Callout / Product Annotation",
      category: "Educational",
      aspectRatio: "1:1",
      tags: ["features", "arrows", "callout", "annotation"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match exact brand colors and typography style.
        Create: a product annotation ad on a [BACKGROUND — e.g. warm cream/light yellow textured] background.
        Top: italic serif headline "[BENEFIT STATEMENT — e.g. Barista grade coffee. Instant. Affordable.]" in [BRAND COLOR — e.g. dark navy].
        Below in massive bold sans-serif: "[VALUE PROP — e.g. ALL IN ONE]".
        Center: [PERSON'S HAND] holding [YOUR PRODUCT] at a natural angle.
        Four curved arrows in [BRAND COLOR] pointing from the product outward to four benefit callout labels arranged around it in bold [BRAND COLOR] text: "[CALLOUT 1-4 — e.g. NO sugar or calories / Multiple Flavors / Iced, cold or hot / Smooth and delicious]".
        Arrows should feel hand-drawn or editorial, not rigid.
        Bottom: full-width [CONTRAST COLOR — e.g. deep navy] banner with [PROMO TEXT — e.g. HUGE SALE + FREE GIFTS] in bold [ACCENT COLOR — e.g. gold/white] with optional emoji accents.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "feature-arrow-callout-product-annotation.webp",
      path: "src/mastra/assets/AdCreatives/feature-arrow-callout-product-annotation.webp",
    },
  },
  {
    prompt: {
      id: 29,
      name: "UGC + Viral Post Overlay",
      category: "UGC",
      aspectRatio: "9:16",
      tags: ["ugc", "viral", "post", "native", "organic"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for product color ONLY. Do NOT use ad layouts or polish. This should look completely native and organic.
        Create: a casual selfie of [PERSON — e.g. a man in mid-20s, beanie, crewneck sweatshirt] doing something mundane [ACTION — e.g. brushing teeth, making coffee, cooking].
        iPhone front camera, slightly grainy, bathroom/kitchen lighting, no professional setup.
        Overlaid in the center of the frame: a realistic screenshot of a [PLATFORM — e.g. Reddit / Twitter / X] post.
        [POST DETAILS — e.g. subreddit name, username, timestamp, upvote count].
        Post title in bold: "[PROVOCATIVE OPINION HEADLINE related to the product's problem/benefit space]".
        Post body in regular text: "[2-3 sentences expanding on the opinion]".
        The post should feel like the person is reacting to it or sharing it — NOT selling a product.
        No product visible.
        No brand logo.
        No CTA.
        The hook is the opinion.
        9:16 aspect ratio.
      `,
    },
    creative: {
      fileName: "ugc-viral-post-overlay.webp",
      path: "src/mastra/assets/AdCreatives/ugc-viral-post-overlay.webp",
    },
  },
  {
    prompt: {
      id: 30,
      name: "Hero Statement + Icon Benefit Bar",
      category: "Product Hero",
      aspectRatio: "1:1",
      tags: ["hero", "statement", "icons", "benefits"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match exact brand colors, packaging, and typography.
        Create: a bold statement ad.
        Top 15%: white banner overlay with massive bold [BRAND COLOR — e.g. dark purple] uppercase sans-serif headline: "[2-3 WORD POWER STATEMENT — e.g. APPETITE KILLER.]" with a period for punch.
        Middle 55%: lifestyle product photo — [SCENE — e.g. woman's hand holding a capsule above an open supplement jar on a clean surface, soft natural light].
        Product label and branding clearly visible.
        Bottom 25%: [SOFT BRAND COLOR — e.g. lavender/light purple] background.
        Three evenly spaced icon-and-text benefit columns: [ICON 1 + LABEL — e.g. crossed-out burger icon with CURB APPETITE] | [ICON 2 + LABEL — e.g. lightning bolt icon with BURN CALORIES] | [ICON 3 + LABEL — e.g. heart + body icon with LOSE WEIGHT].
        Icons are simple line-drawn in [BRAND COLOR] circles.
        Very bottom edge: scrolling ticker bar in [DARK BRAND COLOR] with repeating text: "[SOCIAL PROOF — e.g. OVER 300K+ LIVES CHANGED]".
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "hero-statement-icon-benefit-bar.webp",
      path: "src/mastra/assets/AdCreatives/hero-statement-icon-benefit-bar.webp",
    },
  },
  {
    prompt: {
      id: 31,
      name: "Comparison Grid / Table",
      category: "Comparison",
      aspectRatio: "1:1",
      tags: ["comparison", "grid", "table", "structured"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product packaging precisely.
        Create: a structured comparison grid ad on white background.
        Top row divided 50/50: Left: [YOUR PRODUCT] packaging photographed clean on white with [DETAIL — e.g. chips spilling out].
        Right: [COMPETITOR PRODUCT] packaging on white.
        Below: three horizontal rows spanning full width, each divided 50/50 by a thin black vertical line and separated by thin black horizontal lines.
        Each row compares one attribute: Row 1: "[YOUR ADVANTAGE — e.g. Uses beef tallow.]" vs "[COMPETITOR WEAKNESS — e.g. Uses seed oils.]".
        Row 2: "[YOUR ADVANTAGE — e.g. Organic corn.]" vs "[COMPETITOR WEAKNESS — e.g. Pesticide corn.]".
        Row 3: "[YOUR ADVANTAGE — e.g. Tastes amazing.]" vs "[COMPETITOR WEAKNESS — e.g. Doesn't even taste good.]"
        All text in bold black serif or heavy sans-serif, centered in each cell.
        No icons, no colors, no checkmarks — the copy contrast does the work.
        Should feel like a meme-format comparison that would go viral on X or Reddit.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "comparison-grid-table.webp",
      path: "src/mastra/assets/AdCreatives/comparison-grid-table.webp",
    },
  },
  {
    prompt: {
      id: 32,
      name: "UGC Story Callout / Text Bubble Explainer",
      category: "UGC",
      aspectRatio: "9:16",
      tags: ["ugc", "story", "text-bubble", "educational"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for product color and packaging ONLY. Do NOT use ad layouts or polish. This must look like a real person's Instagram Story.
        Create: a casual iPhone photo of [PERSON DESCRIPTION — e.g. a woman's hand with clean natural nails] holding [YOUR PRODUCT with key packaging details] at a slight angle over [SURFACE/SETTING — e.g. a clean white desk with lifestyle props].
        Natural overhead daylight, slightly warm, iPhone 15 quality.
        Scattered across the frame: 5 text bubbles using Instagram Story's built-in highlighted text tool.
        Each bubble must have a highlighted background for readability, with varied highlight colors between bubbles.
        Bubble 1: "[TOPIC + EMOJI — e.g. gut health 🌱]" large and bold.
        Bubble 2: "[EDUCATIONAL HOOK — a surprising stat or mechanism about why this category matters]".
        Bubble 3: "[WHY THIS PRODUCT — the specific feature that makes it different, excited informal tone]".
        Bubble 4: "[PERSONAL RESULT — early experience update, first-person, with emoji]".
        Bubble 5: "[BRAND ENDORSEMENT — one short line of approval]".
        Should feel casual and hand-placed, not designed.
        9:16 aspect ratio.
      `,
    },
    creative: {
      fileName: "ugc-story-callout-text-bubble-explainer.webp",
      path: "src/mastra/assets/AdCreatives/ugc-story-callout-text-bubble-explainer.webp",
    },
  },
  {
    prompt: {
      id: 33,
      name: "Faux Press / News Articles Screenshot",
      category: "Authority",
      aspectRatio: "4:5",
      tags: ["press", "news", "screenshot", "authority"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference.
        Create: a static ad designed to look like a real online news article screenshot.
        Top 25%: white background with a realistic major publication masthead/logo in large bold black serif text [PUBLICATION STYLE — e.g. "Daily Mail" or "TODAY" or "INSIDER"].
        Below: thin gray horizontal rule.
        Small gray text "Latest Headlines" left-aligned.
        Then: bold black serif headline spanning full width: "[HEADLINE — e.g. 'It's my holy grail product': The $49 vitamin supplement with over 10,000 five-star reviews]".
        Bottom 60%: two side-by-side casual UGC-style photos of [PEOPLE — e.g. two different young women, one brunette, one blonde] each holding [YOUR PRODUCT] in a casual selfie pose — one taken in natural daylight, one in warm indoor evening light.
        Photos should look like real customer submissions, not studio shots.
        No brand logo.
        No CTA.
        Should look like an organic article screenshot someone would share to their story.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "faux-press-news-articles-screenshot.webp",
      path: "src/mastra/assets/AdCreatives/faux-press-news-articles-screenshot.webp",
    },
  },
  {
    prompt: {
      id: 34,
      name: "Faux iPhone Notes / App Screenshot",
      category: "Native",
      aspectRatio: "1:1",
      tags: ["iphone", "notes", "app", "screenshot", "native"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and packaging precisely.
        Create: a static ad disguised as an iPhone Notes app screenshot.
        Top: realistic iOS status bar (time "[TIME — e.g. 10:45]", signal bars, wifi icon, battery icon).
        Below: iOS Notes navigation — blue "< All iCloud" back arrow left, share icon and three-dot menu icon right.
        Below nav: small gray timestamp text "[DATE — e.g. 13 July 2023 10:44]".
        Main content area on white background: bold black serif headline "[HEADLINE — e.g. In Just One Capsule A Day]".
        Below: [3 BENEFIT ROWS], each with a [BRAND COLOR] filled circle checkmark + [EMOJI] + bold black text using food-equivalency format: "[BENEFIT 1 — e.g. More Vitamin D than 800 mushrooms]" / "[BENEFIT 2 — e.g. More Folate than 4 cups of spinach]" / "[BENEFIT 3 — e.g. More Vitamin B1 than 7 cups of broccoli]".
        Right side, overlapping the benefit text slightly: [YOUR PRODUCT] at a slight angle with [DETAILS — e.g. a few gummies/capsules spilling out at the base].
        Product should feel casually placed into the note layout, breaking the frame slightly.
        Clean white background throughout.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "faux-iphone-notes-app-screenshot.webp",
      path: "src/mastra/assets/AdCreatives/faux-iphone-notes-app-screenshot.webp",
    },
  },
  {
    prompt: {
      id: 35,
      name: "Hero Product Showcase + Stat Bar",
      category: "Product Hero",
      aspectRatio: "1:1",
      tags: ["hero", "product", "stats", "showcase"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design, wrapper, and brand colors precisely.
        Create: a product showcase ad on a [BACKGROUND COLOR — e.g. warm sand/beige/cream] background.
        Top: large bold [BRAND COLOR — e.g. chocolate brown] uppercase sans-serif headline: "[SUPERLATIVE CLAIM — e.g. THE WORLD'S HEALTHIEST CHOCOLATE]".
        Below headline: white rounded-rectangle CTA button with [BRAND COLOR] uppercase text "[CTA — e.g. EXPLORE NOW]".
        Center: [YOUR PRODUCT] in full packaging, angled slightly, hero-lit with soft studio lighting.
        Surrounding the product: [SCATTERED ELEMENTS — e.g. broken chocolate pieces, cocoa powder dust, crumbs, ingredient pieces] arranged in an exploded/radial pattern creating visual energy and texture on the background surface.
        Bottom: a white or light rounded-pill stat bar spanning the width with three metrics separated by thin vertical lines: "[STAT 1 — e.g. 12G OF PROTEIN]" | "[STAT 2 — e.g. ≤2G OF SUGAR]" | "[STAT 3 — e.g. ≤3G OF NET CARBS]" in bold [BRAND COLOR] text.
        Numbers should be large and dominant, labels smaller below.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "hero-product-showcase-stat-bar.webp",
      path: "src/mastra/assets/AdCreatives/hero-product-showcase-stat-bar.webp",
    },
  },
  {
    prompt: {
      id: 36,
      name: "Whiteboard Before / After + Product Hold",
      category: "Educational",
      aspectRatio: "4:5",
      tags: ["before-after", "whiteboard", "educational", "ugc"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for product packaging ONLY. Do NOT use ad layouts or polish. This should look like a real person's photo.
        Create: a lifestyle photo set in [SETTING — e.g. a bright modern kitchen].
        In the background: a small tabletop dry-erase whiteboard or flip-chart propped up on [SURFACE — e.g. a marble countertop].
        On the whiteboard: two simple hand-drawn black marker line illustrations side by side — left drawing labeled "[BEFORE LABEL — e.g. De esto...]" showing [BEFORE STATE — e.g. a bloated midsection outline with dots/texture], an arrow pointing right to a second drawing labeled "[AFTER LABEL — e.g. A esto!]" showing [AFTER STATE — e.g. a flatter, smoother midsection outline].
        Below the drawings on the whiteboard: handwritten text in black marker "[HANDWRITTEN CTA — e.g. If you want progress during your health journey, you need this!]".
        In the foreground: [PERSON'S HAND] holding [YOUR PRODUCT] up next to the whiteboard, positioned in the lower-right of the frame.
        Product label clearly visible.
        Shot on iPhone, natural kitchen lighting, casual and educational.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "whiteboard-before-after-product-hold.webp",
      path: "src/mastra/assets/AdCreatives/whiteboard-before-after-product-hold.webp",
    },
  },
  {
    prompt: {
      id: 37,
      name: "Hero Statement + Icon Bar + Offer Burst (Promo Variant)",
      category: "Promotional",
      aspectRatio: "1:1",
      tags: ["hero", "promo", "offer", "burst", "sale"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and brand colors precisely.
        Create: a promotional variant of a hero statement ad on a [BACKGROUND — e.g. dark charcoal/moody gray] background.
        Top 12%: white or light banner with massive bold [DARK COLOR] uppercase sans-serif headline: "[PROVOCATIVE 2-3 WORD STATEMENT — e.g. FUPA KILLER.]" with a period for punch.
        Upper-left of product area: a [BRIGHT ACCENT COLOR — e.g. neon green/lime] comic-style starburst badge rotated slightly, reading "GET UP TO [DISCOUNT — e.g. 40%] OFF" in bold black text.
        Center: [PERSON'S HAND] gripping [YOUR PRODUCT] from above, lifting it off its [PACKAGING — e.g. retail box] below.
        Product label and branding clearly visible.
        Moody, slightly dramatic lighting.
        Bottom 20%: three evenly spaced icon-and-text benefit columns on a semi-transparent dark strip: [ICON 1 + LABEL — e.g. crossed-out burger icon with CURB APPETITE] | [ICON 2 + LABEL — e.g. lightning bolt icon with BURN CALORIES] | [ICON 3 + LABEL — e.g. heart + body icon with LOSE WEIGHT].
        Icons in simple line-art circles with [ACCENT COLOR] highlights.
        Very bottom: full-width [BRIGHT ACCENT COLOR] banner with bold [DARK] text: "[PROMO — e.g. BLACK FRIDAY SPECIAL]".
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "hero-statement-icon-bar-offer-burst-promo-variant.webp",
      path: "src/mastra/assets/AdCreatives/hero-statement-icon-bar-offer-burst-promo-variant.webp",
    },
  },
  {
    prompt: {
      id: 38,
      name: "UGC Lifestyle + Product + Review Card (Split)",
      category: "UGC",
      aspectRatio: "4:5",
      tags: ["ugc", "lifestyle", "review", "split"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact product design and brand colors precisely.
        Create: a vertical split social proof ad.
        Left 55%: a casual UGC-style photo of [PERSON — e.g. a blonde woman in her early 30s, wearing a casual zip-up sweater] enjoying the product in context — [ACTION — e.g. sipping an iced drink through a gold metal straw in a bright café setting].
        Natural lighting, warm and inviting, iPhone-quality casual feel.
        The person should look genuinely happy, not posed.
        Right 45%: solid [PRIMARY BRAND COLOR — e.g. deep indigo/purple] background.
        Top-right: small decorative sparkle/star accents in [ACCENT COLOR — e.g. gold/yellow].
        Floating center-right: [YOUR PRODUCT] at a slight angle, studio-lit on the colored background.
        Below product: a white rounded-rectangle review card with: five filled [ACCENT COLOR] stars at top, then italic or casual serif text: "[SHORT REVIEW QUOTE — e.g. "I will never get drive-thru coffee again"]" in [BRAND COLOR].
        Bottom center: [BRAND LOGO] in white on the colored background, with small decorative sparkle accents.
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "ugc-lifestyle-product-review-card-split.webp",
      path: "src/mastra/assets/AdCreatives/ugc-lifestyle-product-review-card-split.webp",
    },
  },
  {
    prompt: {
      id: 39,
      name: "Curiosity Gap + Scroll-Stopper Hook",
      category: "Hook",
      aspectRatio: "1:1",
      tags: ["curiosity", "hook", "scroll-stop", "provocative"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference for visual tone ONLY. Do NOT include any product, logo, or branding.
        Create: a scroll-stopping curiosity ad designed to look like a truncated social media post.
        Top 35%: clean white background with large bold black sans-serif text (heavy weight, tight leading): "[HOOK HEADLINE — e.g. Most people don't realize THIS is why they struggle but did you know...]".
        The last few words should be followed by "...more" in lighter gray text, mimicking a truncated Facebook/Instagram caption that requires clicking "more" to expand.
        Bottom 65%: a close-up, slightly uncomfortable or attention-grabbing photo of [PROBLEM VISUAL — e.g. the specific physical symptom or problem the product solves, shown on the subject, no product visible].
        Photo should feel real and editorial, not stock.
        Slightly shallow depth of field.
        No text on the photo.
        No product.
        No logo.
        No CTA.
        The entire purpose is to provoke curiosity and earn the click.
        1:1 aspect ratio.
      `,
    },
    creative: {
      fileName: "curiosity-gap-scroll-stopper-hook.webp",
      path: "src/mastra/assets/AdCreatives/curiosity-gap-scroll-stopper-hook.webp",
    },
  },
  {
    prompt: {
      id: 40,
      name: "Native / Ugly Post-It Note Style (Product Hero)",
      category: "Native",
      aspectRatio: "4:5",
      tags: ["native", "post-it", "ugc", "organic"],
      promptText: `
        ⚠️ All [BRACKET TEXT] are layout instructions — never render brackets literally in the image. Replace every placeholder with real, product-appropriate content.
        Use the attached images as brand reference. Match the exact [PRODUCT DESCRIPTION — shape, color, label details, key typography on packaging] precisely.
        Create: a lifestyle product photo set in [REAL-LIFE SETTING — e.g. warm kitchen floor / bathroom counter / living room coffee table] with [LIGHTING DESCRIPTION — e.g. soft natural daylight from a nearby window / warm diffused morning light] and a naturally blurred background showing [BACKGROUND DETAILS — e.g. lower kitchen cabinets and a dog bowl / mirror edge and steam / couch cushions].
        Frame is very slightly off-center — product not perfectly centered, [LEFT / BOTTOM / RIGHT] edge of product very slightly cropped — feels found rather than composed.
        Slight natural sensor grain consistent with a phone camera in indoor daylight.
        Subtle natural vignette at frame corners.
        Center of frame, large and dominant: [FULL PRODUCT DESCRIPTION — packaging colors, key label text, distinguishing visual features] sitting on [SURFACE — e.g. light wood floor / raw wood shelf / marble counter], slightly angled toward the viewer.
        [SCATTERED SURFACE DETAIL — e.g. a few scattered kibble pieces / sea salt crystals / product crumbs] on the surface around the base of the product for casual realism.
        Stuck directly onto the front face of the product: a [POST-IT COLOR — yellow default] square post-it note, slightly crooked and not perfectly straight — slightly trapezoid from the angle it was pressed on.
        Realistic paper texture with a horizontal crease across the middle as if it was folded once.
        Subtle curl at bottom-right corner only.
        Held at the top by a small piece of [TAPE COLOR — clear / yellow / white] tape, slightly wrinkled — not a self-adhesive strip.
        One word in the handwriting is slightly heavier-inked or underlined from natural pen pressure.
        Handwritten in thick black marker-style lettering, imperfect and uneven, lowercase natural writing — not formatted, not centered, not evenly spaced: "[LINE 1 — lowercase, short, setup or hook]" line break "[LINE 2 — continuation or turn]" line break "[LINE 3 — punchline, result, or kicker]" line break "[LINE 4 — optional final beat or emoji]"
        No attribution line.
        No signature.
        Bottom center of frame, outside the photo on a plain white or off-white strip: small plain lowercase sans-serif caption text, looks like someone typed it under an organic post: "[BRAND_WEBSITE — e.g. "www.terravow.com"] — [3-5 word casual caption, sounds typed not written]"
        No logo overlay anywhere in the frame.
        Brand identity carried entirely by the product packaging visible in the photo.
        No border.
        [MOOD — 3 adjectives].
        4:5 aspect ratio.
      `,
    },
    creative: {
      fileName: "native-ugly-post-it-note-style-product-hero.webp",
      path: "src/mastra/assets/AdCreatives/native-ugly-post-it-note-style-product-hero.webp",
    },
  },
];

/**
 * Get the base path for the project
 * Handles both development and production environments
 */
function getBasePath(): string {
  // In development, use process.cwd()
  // In production, you might need to adjust this based on your build setup
  return process.cwd();
}

/**
 * Validates the complete mapping to ensure all prompts have corresponding creatives
 * and that all creative files exist on disk
 */
export function validateMapping(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const basePath = getBasePath();

  // Check if we have exactly 40 mappings
  if (PROMPT_CREATIVE_MAPPINGS.length !== 40) {
    errors.push(
      `Expected 40 mappings but found ${PROMPT_CREATIVE_MAPPINGS.length}`,
    );
  }

  // Check for duplicate prompt IDs
  const promptIds = new Set<number>();
  const creativeFileNames = new Set<string>();

  for (const mapping of PROMPT_CREATIVE_MAPPINGS) {
    const { prompt, creative } = mapping;

    // Check for duplicate prompt ID
    if (promptIds.has(prompt.id)) {
      errors.push(`Duplicate prompt ID found: ${prompt.id}`);
    }
    promptIds.add(prompt.id);

    // Check for duplicate creative file
    if (creativeFileNames.has(creative.fileName)) {
      warnings.push(`Duplicate creative file found: ${creative.fileName}`);
    }
    creativeFileNames.add(creative.fileName);

    // Check if file exists
    const fullPath = join(basePath, creative.path);
    if (!existsSync(fullPath)) {
      errors.push(
        `Creative file not found: ${creative.fileName} at ${fullPath}`,
      );
    }

    // Validate prompt ID range
    if (prompt.id < 1 || prompt.id > 40) {
      errors.push(`Invalid prompt ID: ${prompt.id} (must be between 1 and 40)`);
    }

    // Validate aspect ratio
    if (!["1:1", "4:5", "9:16"].includes(prompt.aspectRatio)) {
      errors.push(
        `Invalid aspect ratio for prompt ${prompt.id}: ${prompt.aspectRatio}`,
      );
    }
  }

  // Check for missing prompt IDs (should be sequential from 1 to 40)
  for (let i = 1; i <= 40; i++) {
    if (!promptIds.has(i)) {
      errors.push(`Missing prompt ID: ${i}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get the ad creative for a specific prompt ID
 */
export function getCreativeForPrompt(
  promptId: number,
): PromptCreativeMapping | undefined {
  return PROMPT_CREATIVE_MAPPINGS.find(
    (mapping) => mapping.prompt.id === promptId,
  );
}

/**
 * Get all prompts for a specific aspect ratio
 */
export function getPromptsByAspectRatio(
  aspectRatio: "1:1" | "4:5" | "9:16",
): PromptCreativeMapping[] {
  return PROMPT_CREATIVE_MAPPINGS.filter(
    (mapping) => mapping.prompt.aspectRatio === aspectRatio,
  );
}

/**
 * Get all prompts for a specific category
 */
export function getPromptsByCategory(
  category: string,
): PromptCreativeMapping[] {
  return PROMPT_CREATIVE_MAPPINGS.filter(
    (mapping) => mapping.prompt.category === category,
  );
}

/**
 * Get all prompts that have a specific tag
 */
export function getPromptsByTag(tag: string): PromptCreativeMapping[] {
  return PROMPT_CREATIVE_MAPPINGS.filter((mapping) =>
    mapping.prompt.tags.includes(tag),
  );
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  PROMPT_CREATIVE_MAPPINGS.forEach((mapping) => {
    categories.add(mapping.prompt.category);
  });
  return Array.from(categories).sort();
}

/**
 * Get all available tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  PROMPT_CREATIVE_MAPPINGS.forEach((mapping) => {
    mapping.prompt.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get all mappings
 */
export function getAllMappings(): PromptCreativeMapping[] {
  return PROMPT_CREATIVE_MAPPINGS;
}

/**
 * Get a mapping by prompt name (case-insensitive)
 */
export function getCreativeByPromptName(
  name: string,
): PromptCreativeMapping | undefined {
  const normalizedName = name.toLowerCase();
  return PROMPT_CREATIVE_MAPPINGS.find(
    (mapping) => mapping.prompt.name.toLowerCase() === normalizedName,
  );
}
