# RS3-Hub Post-Launch Roadmap

_Last updated: 2026-02-25_

---

## Current Feature Set (at launch)

- 25 skill guides (P2P + Ironman), 24 skill calculators, 270 quest tracker
- Dashboard with hiscores integration, daily tasks, wilderness events, slayer log
- Auth system (register, login, admin), mobile responsive, SEO, changelog

---

## Tier 1 — High Impact, Low Effort

Features players will notice immediately and that build return visits.

### 1. GE Price Integration

Pull live Grand Exchange prices from the [RS3 GE API](https://runescape.com/ge) (public, no key required) and display item prices inline on relevant calculator pages.

**Where it helps:**
- Herblore calculator: show GP/XP ratio per potion with live ingredient prices
- Smithing, Crafting, Fletching calculators: cost per item, profit/loss if alching
- A new "Money Making" section with methods that auto-update with current prices

**Implementation:** Add a thin server-side proxy endpoint (`/api/ge-price/:itemId`) that fetches from the Jagex GE API and caches for 15 minutes to avoid hammering the endpoint. Display on calc pages as a secondary column.

---

### 2. Money Making Guides Hub

A `/money-making` hub page mirroring the `/guides` structure but focused on GP/hr methods — skilling, bossing, and passive income. Each method as a card with:
- GP/hr estimate, skill requirements, effort level (AFK / Active / Intensive)
- Quick summary of the method
- Link to relevant wiki page

**Why:** This is the most Googled category of RS content after leveling guides. It would drive significant organic traffic.

**Content categories:**
- Skilling (e.g., Elder logs, Rocktails, Primal bars)
- Bossing (e.g., Nex, Araxxor, Zamorak, Ambassador)
- Passive / Low-effort (e.g., kingdom, POF, daily challenges)

---

### 3. AFK Skill Timers

A timer tool for AFK training methods — set the activity, and a countdown tells you when to click next. Useful for:

- Smelting at Edgeville furnace (~35s per action)
- Cutting ivy (~2min patches)
- Elder logs at Draynor (~90s per inventory)
- Incandescent wisps, Luminous wisps, etc.

**Implementation:** Simple client-side page, no backend needed. Timer presets stored in a JS config, user picks activity and clicks start. Optional browser notification when timer fires (`Notification.requestPermission()`).

**Why:** Players have this tab open while AFK — exactly the kind of sticky tool that drives daily return visits.

---

### 4. Max / Completionist Cape Tracker

A checklist page for players working toward the Max Cape, Completionist Cape, or Trimmed Completionist Cape. Requirements are static (wiki-sourced) so no API needed.

**Requirements tracked:**
- Max Cape: all skills to 99 (already shown on Dashboard — just needs a dedicated summary page)
- Comp Cape: all skills maxed + all quests + specific minigames/achievements
- Trimmed Comp: additional elite achievement requirements

**Implementation:** Static requirement data + compare against user's hiscores (already fetched for the Dashboard). Show as a checklist with green/red status. Shareable URL (`/comp-tracker?rsn=PlayerName`) for social sharing.

---

### 5. Farming Patch Tracker

A timer/checklist tool for farming runs. Player checks off which patches they planted and when — the tracker shows when each crop finishes growing. Crops per patch type:

- Allotments, Herbs, Trees, Fruit trees, Spirit trees, Mushrooms, Cactus, etc.
- Timers based on RS3 growth cycles (per patch type)

**Implementation:** State stored in `localStorage` (no login required). Optional: persist to DB for logged-in users. Timer data is static from the wiki.

**Why:** Farming is the #1 AFK skill. Players do runs every few hours and constantly want to know when their patches are done.

---

## Tier 2 — Medium Impact, Medium Effort

### 6. Boss Guides Hub

A `/bosses` hub mirroring `/guides`, covering the major endgame bosses:

**Priority bosses to cover:**
- Nex (Angel of Death) — high-volume learner boss
- Araxxor — mechanical boss, popular for guides
- Vorago — duo/group, complex mechanics
- Zamorak (City of Sentinels) — currently top-tier
- Solak — group boss
- Ambassador (Elite Dungeons 3)
- Telos — solo progression

**Format per boss:** Gear requirements, recommended stats, mechanics breakdown, phase guide, common mistakes. P2P only — no Ironman toggle needed for bosses.

---

### 7. Combat Revolution Setup Guide

RS3's Revolution++ system is confusing to new and returning players. A static guide page (or calculator-style tool) that recommends:

- Optimal ability bar layouts per combat style (Melee, Ranged, Magic, Necromancy)
- Threshold/Ultimate ordering for different scenarios (AFK, semi-AFK, boss)
- Gear tier recommendations per combat budget

**Why:** Every RS3 player needs this at some point. It's high-SEO content ("RS3 revolution bar setup") that wiki pages don't present in a beginner-friendly way.

---

### 8. DXP Weekend Planner

A tool for planning Double XP Live weekends:

- Input: current XP, target XP, selected skill
- Output: supplies needed, estimated cost (with live GE prices if Tier 1 GE integration is done), how many hours of DXP are required

**Extension:** Multi-skill planning — add multiple skills and see total supply list. This is especially useful for Herblore, Smithing, and Construction.

---

### 9. Hiscores Comparison

Compare two players side by side — your character vs a friend or a rival. Show:

- Level + XP per skill, delta between them (green/red arrows)
- Who has more 99s, total level, total XP
- Quest points comparison (if we can get that from hiscores)

**Implementation:** Two character inputs, both fetched via the existing hiscores proxy. Side-by-side table.

---

### 10. Goal Planner (Multi-Skill)

Players often have compound goals like "get all skills to 90 before DXP." A planning tool where they:

1. Set a target level for multiple skills
2. See total XP needed across all skills
3. See estimated cost if using buyable methods (requires GE prices)

Builds on top of the existing single-skill calculators.

---

## Tier 3 — Longer Term / Higher Effort

### 11. Collection Log Tracker

A checklist of obtainable items/completions per activity:

- Boss drops, Slayer collections, Minigame rewards, Skilling outfits
- Player checks off what they've obtained
- Progress per category (e.g., "12/24 Nex items")

Fully client-side with `localStorage` (no login), with optional DB sync for logged-in users.

---

### 12. Player-Owned Farm / Arc Tracker

Two long-running Ironman-relevant activities that benefit from tracking:

- **Player-Owned Farm:** track which pens have which animals, when they mature, breeding status
- **The Arc:** track supplies, daily resets, Uncharted Island resources

Both are niche but have dedicated fanbases who would appreciate a dedicated tool.

---

### 13. Clan Skill Race

A fun social tool for clans — input a list of RSNs, pick a skill, and see a leaderboard of XP gained over the last 7/30 days (comparing hiscores snapshots). Lightweight, no clan auth needed — just RSN lists.

---

### 14. Notification System (PWA Push)

Convert the site to a PWA and add opt-in push notifications for:

- Farming patch timers finishing
- Wilderness Flash Event alerts (already tracked on the Dashboard)
- Site changelog notifications ("new guide added")

---

## Monetization Sequencing

| When | What |
| --- | --- |
| **Launch** | Patreon / Ko-fi link in footer |
| **After 1k MAU** | Carbon Ads or AdSense on guide/calculator pages |
| **After 5k MAU** | Pro tier: ad-free + GE price history + saved builds (Stripe) |
| **After 10k MAU** | Affiliate: Jagex bond links, RS merch store |

---

## SEO Priority Order

These feature pages have the highest potential for organic Google traffic from RS3 players:

1. Money Making Guides (`/money-making`)
2. Boss Guides (`/bosses`)
3. Revolution Bar Guide (`/guides/combat`)
4. Farming Patch Tracker (`/tools/farming`)
5. DXP Planner (`/tools/dxp-planner`)
6. Comp Cape Tracker (`/tools/comp-tracker`)

---

## Notes

- All Tier 1 features can be built without touching the existing backend — client-side or thin proxy endpoints only.
- The GE price integration unlocks the most value across existing calculators and should be done early.
- Boss guides are pure content work (no new tech), same model as skill guides — just needs writing time.
