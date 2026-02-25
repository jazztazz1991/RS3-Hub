# Quest Guide Images

Store quest step images here, organised by quest slug (URL-encoded title with spaces as underscores, lowercased).

## Folder structure

```
images/quests/
  contact/
    maze-map.png
  spirits_of_the_elid/
    waterfall-location.png
  recipe_for_disaster/
    ...
```

## How to add an image to a quest step

In `client/src/data/quests/questData.js`, change the relevant guide step from a plain string to an object:

```js
// Before
"Navigate the maze..."

// After
{
  "text": "Navigate the maze — see the map for the correct route.",
  "image": "/images/quests/contact/maze-map.png",
  "imageAlt": "Dungeon maze map showing ladder positions"
}
```

The `image` path is relative to `client/public/`, so `/images/quests/contact/maze-map.png`
maps to `client/public/images/quests/contact/maze-map.png`.

## Image guidelines

- Preferred format: `.webp` (smallest) or `.png`
- Max source width: ~800px (displayed capped at 420px)
- Name files descriptively: `maze-map.png`, `waterfall-location.png`, etc.
- Always fill in `imageAlt` for accessibility
