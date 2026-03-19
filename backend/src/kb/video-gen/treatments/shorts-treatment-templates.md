# Shorts Treatment Templates
**Sources:**
- [Talking Head Video: How to Make and Edit One + Examples](https://riverside.fm/blog/talking-head-videos)
- [Talking Head Videos Explained - Filmora](https://filmora.wondershare.com/youtube-video-tips/talking-head-videos.html)
- [14 Best Talking Head Video Examples + Templates - Synthesia](https://www.synthesia.io/post/best-talking-head-video-examples)
- [B-Roll: How to Use it For Video Content - PlayPlay](https://playplay.com/glossary/b-roll)
- [How To Use B-Roll in Instagram Reels](https://studiogently.com/journal/how-to-use-b-roll-video-instagram-reels-tiktok)
- [Short-Form Video Strategy for Business - Social Media Examiner](https://www.socialmediaexaminer.com/short-form-video-strategy-for-business-with-reels-and-tiktok/)
- [9 Ways to Repurpose Video Content](https://flockler.com/blog/repurpose-video-content)
- [Best Structure for Short-Form Videos - WolfPack](https://wolfpackadvising.com/blog/best-structure-for-short-form-videos/)
- [How Brands Can Repurpose Long-Form Content Into Promotional Video Snippets](https://housesparrowfilms.com/blogs/how-brands-can-repurpose-long-form-content-into-promotional-video-snippets)
- [Short-Form Content Guide 2025: Formats, Tips, and Platforms](https://async.com/blog/short-form-content/)

**Date:** 2026-03-18

## Key Takeaways
- There are 8-10 distinct treatment styles that cover 95%+ of short-form content needs
- Each treatment style has a specific structure, pacing, and visual language
- Treatments should be defined as reusable templates with customizable parameters
- The best shorts combine multiple treatment elements (e.g., talking head + B-roll overlay)
- Treatment selection should match the source material and target audience
- Trade business content (plumbers, HVAC, salons) maps well to specific treatment types

## Content

### Treatment Style Catalog

---

#### 1. Talking Head Extract

**Description:** A direct-to-camera clip extracted from a longer recording. The speaker addresses the viewer directly with a single focused message.

**Structure:**
```
[0-3s]  HOOK: Bold statement or question (text overlay + spoken)
[3-20s] BODY: Speaker delivers the core message
[20-25s] CTA: "Follow for more" / "Link in bio" / "What do you think?"
```

**Visual Elements:**
- Speaker centered in frame (head and shoulders)
- Clean background or slightly blurred environment
- Animated captions (word-by-word highlight)
- Optional: name/title lower third

**Best For:** Expert positioning, tips, opinions, hot takes, educational content

**Trade Business Example:** Plumber explains "3 signs your water heater is about to fail" directly to camera from a job site.

**Parameters:**
```json
{
  "treatment": "talking_head",
  "reframe": true,
  "captions": "word_highlight",
  "lower_third": { "name": "", "title": "" },
  "cta_type": "follow",
  "hook_style": "bold_claim"
}
```

---

#### 2. Highlight Reel / Montage

**Description:** Fast-cut compilation of the best moments from one or more longer videos. High energy, music-driven, minimal talking.

**Structure:**
```
[0-2s]  HOOK: Most impressive visual moment
[2-20s] BODY: 4-8 clips, 2-4 seconds each, cut on the beat
[20-25s] FINALE: Best moment repeated or slow-mo + CTA overlay
```

**Visual Elements:**
- Fast cuts synced to music beat
- Transitions (swipe, zoom, flash)
- Text overlays for context ("Before" / "After" / "Day 1" / "Day 30")
- Music is primary audio (speech secondary or absent)

**Best For:** Transformations, project showcases, event recaps, portfolio reels

**Trade Business Example:** HVAC company shows 6 installations in 30 seconds -- each clip shows the before/after with a satisfying reveal.

**Parameters:**
```json
{
  "treatment": "highlight_reel",
  "clips_count": 6,
  "clip_duration": "2-4s",
  "music": "upbeat_trending",
  "transitions": "beat_sync",
  "text_overlays": ["before", "after"],
  "cta_type": "portfolio"
}
```

---

#### 3. Quote Overlay / Text-on-Video

**Description:** A short video clip (3-10 seconds, often looped) with a text overlay delivering the main message. The video is atmospheric, not the focus.

**Structure:**
```
[0-10s] Single clip or slow-mo loop
        TEXT: 1-3 lines of impactful text overlay
        MUSIC: Trending audio or ambient
[Loop]  Video loops seamlessly
```

**Visual Elements:**
- Background video is cinematic / atmospheric
- Large, bold text centered in frame
- Minimal or no spoken audio
- Text animates in (typewriter, fade, slide)
- Color grading for mood

**Best For:** Quotes, statistics, testimonials, announcements, motivational content

**Trade Business Example:** Slow-mo of sparks from welding with overlay text: "87% of homeowners regret not fixing this sooner."

**Parameters:**
```json
{
  "treatment": "quote_overlay",
  "bg_video": "atmospheric_loop",
  "text_lines": ["line1", "line2"],
  "text_animation": "typewriter",
  "music": "ambient",
  "loop": true
}
```

---

#### 4. B-Roll Montage with Voiceover

**Description:** Supplemental footage plays while a voiceover narrates. The speaker is not visible; the visuals illustrate the narration.

**Structure:**
```
[0-3s]  HOOK: Compelling opening line (voiceover) + interesting visual
[3-25s] BODY: B-roll clips change every 2-4 seconds, synced to narration
[25-30s] CTA: Final visual + voiceover call-to-action
```

**Visual Elements:**
- Multiple B-roll clips (stock footage, original footage, or AI-generated)
- Smooth transitions between clips
- Animated captions displaying the voiceover text
- Optional: subtle background music under the voiceover

**Best For:** Educational content, storytelling, explanations, product showcases

**Trade Business Example:** Voiceover explains "What happens during a home inspection" while B-roll shows the inspector checking foundation, wiring, plumbing.

**Parameters:**
```json
{
  "treatment": "broll_voiceover",
  "voiceover_source": "original_audio" | "ai_tts",
  "broll_sources": ["stock", "original", "ai_generated"],
  "clip_change_interval": "2-4s",
  "captions": "phrase",
  "music": "subtle_underscore"
}
```

---

#### 5. Reaction Clip

**Description:** Speaker reacts to content (another video, a comment, a news item). Split-screen or picture-in-picture format.

**Structure:**
```
[0-2s]  HOOK: Show the content being reacted to (the trigger)
[2-20s] BODY: Speaker's reaction + commentary
[20-25s] CONCLUSION: Final take + CTA
```

**Visual Elements:**
- Split screen (reaction content top, speaker bottom) or PiP
- Speaker's facial expressions are prominently visible
- Original content clearly visible
- Captions on speaker's commentary

**Best For:** Trend commentary, responding to customer questions, industry news reaction, duet-style content

**Trade Business Example:** Electrician reacts to a viral "DIY electrical" TikTok, explaining what's dangerous about it.

**Parameters:**
```json
{
  "treatment": "reaction",
  "layout": "split_screen" | "pip",
  "source_content": "url_or_clip",
  "speaker_position": "bottom" | "corner",
  "captions": "word_highlight"
}
```

---

#### 6. Tutorial / How-To Snippet

**Description:** A single, focused tutorial extracted from longer educational content. Shows one specific technique or tip.

**Structure:**
```
[0-3s]  HOOK: "How to [do X] in [timeframe]" (text + spoken)
[3-10s] STEP 1: Demonstrate first step (close-up)
[10-20s] STEP 2-3: Continue demonstration
[20-25s] RESULT: Show the finished outcome
[25-30s] CTA: "Save this for later" / "Follow for more tips"
```

**Visual Elements:**
- Close-up shots of hands/work
- Step numbers overlaid ("Step 1", "Step 2")
- Before/after comparison
- Animated captions
- Optional: speed ramp (speed up boring parts)

**Best For:** Skill demonstrations, DIY tips, professional techniques, product usage

**Trade Business Example:** Plumber shows "How to fix a running toilet in 60 seconds" with close-ups of each step.

**Parameters:**
```json
{
  "treatment": "tutorial",
  "steps_count": 3,
  "show_result": true,
  "speed_ramp": true,
  "step_labels": true,
  "captions": "phrase",
  "cta_type": "save"
}
```

---

#### 7. Before/After Transformation

**Description:** Visual comparison showing a transformation. Extremely effective for service businesses.

**Structure:**
```
[0-2s]  HOOK: "Watch this transformation" or show the "before" state
[2-5s]  BEFORE: Establish the problem state
[5-7s]  TRANSITION: Satisfying reveal (swipe, flash, timelapse)
[7-15s] AFTER: Show the completed work from multiple angles
[15-20s] CTA: "Book your transformation" / contact info
```

**Visual Elements:**
- Side-by-side or sequential before/after
- Transition effect (swipe reveal is most popular)
- Satisfying reveal moment
- Optional: time-lapse of the work being done
- Text: "Before" / "After" labels

**Best For:** Renovations, repairs, cleaning, landscaping, beauty services, any visual transformation

**Trade Business Example:** Salon shows a dramatic hair transformation with a swipe reveal and trending audio.

**Parameters:**
```json
{
  "treatment": "before_after",
  "transition": "swipe" | "flash" | "timelapse" | "fade",
  "before_duration": "3s",
  "after_duration": "8s",
  "labels": true,
  "music": "satisfying_reveal",
  "cta_type": "book_now"
}
```

---

#### 8. Listicle / Countdown

**Description:** Numbered list of tips, items, or facts. Each item gets 3-5 seconds with a visual change.

**Structure:**
```
[0-3s]  HOOK: "5 things every [audience] needs to know"
[3-8s]  #1: First item (visual + text + spoken)
[8-13s] #2: Second item
[13-18s] #3: Third item
[18-23s] #4: Fourth item (optional)
[23-28s] #5: Fifth item (make it the best one)
[28-30s] CTA: "Which one surprised you?" / "Comment below"
```

**Visual Elements:**
- Number overlay for each item
- Visual change with each new item (new clip, color change, or transition)
- Progress indicator (optional)
- Each item has its own text overlay
- Pacing: slight pause between items

**Best For:** Tips, myths, facts, recommendations, mistakes to avoid

**Trade Business Example:** "5 things your HVAC tech wishes you knew" -- each tip with relevant B-roll.

**Parameters:**
```json
{
  "treatment": "listicle",
  "items_count": 5,
  "per_item_duration": "4-5s",
  "numbering_style": "large_number" | "progress_bar" | "countdown",
  "captions": "phrase",
  "cta_type": "engagement_question"
}
```

---

#### 9. Customer Testimonial / Social Proof

**Description:** A customer's positive experience, either as a direct-to-camera clip or as a text overlay on relevant footage.

**Structure:**
```
[0-3s]  HOOK: Star rating visual or "Here's what [customer] said..."
[3-20s] BODY: Customer speaks or text testimonial displayed over footage
[20-25s] RESULT: Show the work/product they're praising
[25-30s] CTA: "Get the same results" + booking info
```

**Visual Elements:**
- Star rating animation
- Customer photo or video
- Quote marks around text testimonials
- Before/after of their specific project
- Business branding subtle but present

**Best For:** Building trust, showcasing results, local business marketing

**Trade Business Example:** Happy homeowner on camera: "They fixed our AC in 2 hours on a Saturday. Lifesavers!" with footage of the completed work.

**Parameters:**
```json
{
  "treatment": "testimonial",
  "format": "video" | "text_overlay",
  "star_rating": 5,
  "customer_name": "",
  "show_work": true,
  "cta_type": "book_now"
}
```

---

#### 10. Day-in-the-Life / Behind-the-Scenes

**Description:** Authentic, casual footage showing real work being done. Humanizes the business.

**Structure:**
```
[0-3s]  HOOK: "Come with me to a [job type]" or "POV: You're a [trade]"
[3-25s] BODY: Series of clips from the workday, voiceover or captions
[25-30s] WRAP: Satisfying completion moment + CTA
```

**Visual Elements:**
- Raw/authentic camera work (phone footage is fine)
- Time stamps or location labels
- Casual captions
- Trending audio or lo-fi music
- POV shots when possible

**Best For:** Brand personality, recruitment, showing expertise, humanizing the business

**Trade Business Example:** "6 AM start for this emergency plumbing call" -- follows the plumber from truck to diagnosis to fix.

**Parameters:**
```json
{
  "treatment": "day_in_life",
  "clips_count": 5,
  "voiceover": true | false,
  "time_labels": true,
  "style": "authentic",
  "music": "lo_fi" | "trending",
  "cta_type": "follow"
}
```

### Treatment Selection Guide

| Source Material | Recommended Treatment | Secondary Option |
|----------------|----------------------|-----------------|
| Podcast/interview | Talking Head Extract | Reaction Clip |
| Job site footage | Before/After | Day-in-the-Life |
| How-to recording | Tutorial Snippet | Listicle |
| Customer review | Testimonial | Quote Overlay |
| Multiple short clips | Highlight Reel | B-Roll Montage |
| Expert commentary | Talking Head Extract | Listicle |
| Trending topic | Reaction Clip | Quote Overlay |
| Portfolio/gallery | Highlight Reel | Before/After |
| Statistics/data | Quote Overlay | Listicle |
| Event/conference | Highlight Reel | Day-in-the-Life |

### Trade Business Treatment Priority

For Atlas UX's target audience (plumbers, HVAC, salons, electricians):

1. **Before/After** -- Highest conversion potential for service businesses
2. **Tutorial Snippet** -- Establishes expertise, drives trust
3. **Testimonial** -- Social proof, critical for local businesses
4. **Day-in-the-Life** -- Humanizes the brand, great for recruitment
5. **Listicle** -- Educational content that positions as expert
6. **Talking Head** -- Direct advice and tips
7. **Highlight Reel** -- Portfolio showcase
8. **Quote Overlay** -- Quick stats and social proof
9. **Reaction Clip** -- Industry commentary, trend participation
10. **B-Roll Voiceover** -- Explanatory content for complex services

## Tools & Services
- **Template platforms:** CapCut (free templates), Canva (customizable), Adobe Express (brand kit)
- **AI treatment selection:** OpusClip and Vizard can suggest treatment styles based on content analysis
- **B-roll sources:** Pexels, Unsplash (free), Storyblocks, Artgrid (paid), AI-generated (Runway, Pika)
- **Music libraries:** Epidemic Sound ($15/mo), Artlist ($10/mo), CapCut (built-in free), YouTube Audio Library (free)

## Integration Notes for Atlas UX
- Each treatment template should be a JSON schema that Venny/Victor can populate from source material
- Treatment selection can be semi-automated: analyze source video content and suggest top 3 matching templates
- Store treatment templates as versioned configs so they can be updated without code changes
- Allow per-tenant treatment customization (brand colors, fonts, logo placement, CTA text)
- The treatment pipeline flow: Source Video -> Clip Selection -> Treatment Selection -> Reframing -> Captioning -> Export
- For trade businesses, default to Before/After and Tutorial treatments when source contains visual transformation
- Track which treatment styles perform best per industry vertical to improve future recommendations
- Consider a "treatment preview" that generates a 5-second preview before full rendering (saves compute)
- Treatment parameters should be exposed in a simple UI for non-technical trade business owners


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
