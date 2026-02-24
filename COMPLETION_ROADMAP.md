# RS3-Hub Completion Roadmap

_Last updated: 2026-02-24_

---

## Current State Summary

The site is substantially complete. Core infrastructure, content, and UX polish are all in place:

- **24 skill guides** with P2P + Ironman variants (all meaningful skilling skills)
- **24 skill calculators** (all meaningful skilling skills covered)
- **270 quests** in the quest tracker with skill/quest requirement checking
- **Full auth system** (register, login, session, admin roles) with polished auth pages
- **Character tracking** via Jagex hiscores proxy with DB caching
- **Dashboard** with skill cards that expand to show Guide / Calculator / Wiki links
- **Daily tasks tracker**, Wilderness event notifications, Slayer log
- **Admin/Support dashboards** with bug report and suggestion systems
- **Test suite** — 357 passing tests across skill data, guide JSON, and quest data
- **Landing page** at `/` for unauthenticated users
- **Custom 404 page** with context-aware nav links
- **Mobile responsive** — hamburger nav, calculator layouts, quest tracker, dashboard all fixed for 375px+

---

## Priority 1 — Monetization

Since RS3-Hub plans to monetize, here are the most practical paths ranked by implementation effort:

| Method | Effort | Notes |
| --- | --- | --- |
| **Patreon / Ko-fi link** | Very low | Add a support link to the navbar or footer — community goodwill model |
| **Display ads (Carbon Ads)** | Low | Developer-focused ad network, non-intrusive; add a sidebar slot to guide/calculator pages |
| **Google AdSense** | Low | Broader reach; place banner ads at bottom of guide/calculator pages |
| **Affiliate links** | Low | Link to the Jagex bonds page or RS merch store where relevant |
| **"Pro" tier** | Medium-High | Requires Stripe integration, feature gating (e.g. ad-free, extra calculator features, saved builds) |

**Recommendation:** Start with a Patreon link and Carbon Ads (or AdSense) as soon as content is solid. Add a Pro tier once the user base is established enough to justify the Stripe integration work.

---

## Priority 2 — Technical

### Daily Tasks Content Accuracy

The daily/weekly/monthly tasks list in `client/src/data/common/dailyTasksData.js` should be verified against current RS3 content — game updates may have changed reset timers or task availability.

### Google OAuth

The code is already written and present in `server/routes/auth.js` (lines 48–62, currently commented out). Re-enabling requires:
1. Creating a Google Cloud OAuth 2.0 client ID
2. Adding `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment variables
3. Uncommenting the passport Google strategy and callback route

### Slayer Log DB Persistence

The Slayer Log component and `SlayerTask` model exist. Confirm that task saves are working correctly end-to-end (frontend → API → database → reload) before launch.

### Ranged Guide (Optional)

Ranged can be trained actively via chinchompas, charming imps, and Anachronia. A guide is optional but would complete "all skills" coverage.

---

## Quick Wins (< 1 hour each)

- [ ] Add a favicon if not already set
- [ ] Add `<meta>` description tags to the HTML template for basic SEO
- [ ] Confirm `robots.txt` and `sitemap.xml` are configured for Render deployment
- [ ] Add `rel="noopener noreferrer"` to all external links (wiki links, etc.)

---

## Checklist

### Must-Have Before Launch

- [x] 24 skill guides (all skilling skills covered)
- [x] Landing page at `/`
- [x] Custom 404 page
- [x] Dashboard skill card expansion (Guide / Calculator / Wiki links)
- [x] Quest tracker table layout
- [x] Quest details page cleaned up
- [x] Mobile responsiveness (hamburger nav, calc layouts, quest tracker, dashboard)
- [x] Auth pages polished to match site aesthetic

### Should-Have

- [x] Guide quality pass (Divination P2P/Ironman rewritten, Firemaking P2P/Ironman rewritten)
- [ ] At least one monetization path live (Patreon link minimum)
- [ ] Daily tasks content verified against current RS3

### Nice-to-Have

- [ ] Google OAuth re-enabled
- [ ] Ranged guide
- [ ] Pro tier / Stripe integration
- [ ] SEO meta tags and sitemap
