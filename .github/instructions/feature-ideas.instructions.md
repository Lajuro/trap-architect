---
description: "Use when implementing new game features, mechanics, enemies, editor tools, social features, cosmetics, or quality-of-life improvements for Trap Architect. Reference this file to check which features are pending, in-progress, or completed. Update status after each implementation."
---

# Feature Ideas — Trap Architect

> **Workflow**: Before implementing a feature, mark it as 🔨 In Progress. After
> completing, mark it ✅ Completed with a short note (commit hash or PR).
> Always run `bun run build` to validate before marking complete.

---

## Status Legend

| Icon | Meaning |
|------|---------|
| 📋 | Pending — not started |
| 🔨 | In Progress — currently being implemented |
| ✅ | Completed — implemented and validated |

---

## A. New Gameplay Mechanics

### A1. Teleporters (Portais) ✅

**Tile types**: `TELEPORTER_A`, `TELEPORTER_B` (paired portals with matching colors)

**Behavior**:
- Player enters a teleporter → instantly moved to the paired exit teleporter
- Each pair has a unique color/ID (support at least 4 pairs: blue, orange, green, purple)
- Entry direction determines exit direction (maintain velocity)
- 500ms cooldown after teleporting to prevent infinite loops
- Visual: swirling particle effect at each portal, color-coded

**Editor integration**:
- Add to "Interactive" palette category
- When placing teleporter A, show ghost indicator for where B should go
- Troll potential: pair teleporters that loop the player, or send them into spikes

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts`, `EditorScene.ts`, `EditorSidebar.tsx`, `BootScene.ts` (textures)

---

### A2. Cannon Projectiles (Canhões) ✅

**Tile types**: `CANNON_LEFT`, `CANNON_RIGHT`, `CANNON_UP`, `CANNON_DOWN`

**Behavior**:
- Fires a bullet/cannonball every 120 frames (2 seconds at 60fps)
- Bullet travels at 3 pixels/frame in the cannon's facing direction
- Bullet is destroyed on contact with solid tiles
- Player hit = death (unless Star power-up active)
- Bullet does NOT kill enemies (pass through)
- Visual: cannon body is a barrel block; bullet is a small sphere with trail

**Editor integration**:
- Add to "Danger" palette category
- Show firing direction preview arrow in editor
- Each cannon can optionally have a configurable delay offset (0-120 frames) to stagger firing patterns

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts` (bullet entity system), `EditorScene.ts`, `BootScene.ts`

---

### A3. Sticky/Magnetic Blocks (Blocos Pegajosos) ✅

**Tile type**: `STICKY_BLOCK`

**Behavior**:
- Player touching a sticky surface auto-attaches (ceiling, wall, or floor)
- While attached: player cannot move freely, only jump to detach
- Ceiling stick: player hangs upside-down, gravity paused
- Wall stick: similar to wall slide but player stops completely
- Jump from sticky surface uses normal jump force
- Works in gravity-flipped state too

**Editor integration**:
- Add to "Interactive" palette category
- Visual: block has a gooey/honey-colored surface with drip particles

**Files to modify**: `constants.ts`, `GameScene.ts` (collision handlers), `EditorScene.ts`, `BootScene.ts`

---

### A4. Keys and Locks (Chaves e Fechaduras) ✅

**Tile/Entity types**: `KEY_RED`, `KEY_BLUE`, `KEY_GREEN`, `LOCK_RED`, `LOCK_BLUE`, `LOCK_GREEN`

**Behavior**:
- Keys are collectible entities (like coins)
- Locks are solid blocks that disappear when player has the matching key
- Collecting a key: HUD shows key icon, plays pickup sound
- Touching a lock with correct key: lock dissolves (animation), key consumed
- Without key: lock is solid, impassable
- Keys persist through checkpoints (saved in checkpoint state)
- One key opens ONE matching lock (1:1 relationship), or optionally one key opens ALL locks of that color (configurable per level)

**Editor integration**:
- Add keys to "Entities" category, locks to "Interactive" category
- Color-coded preview in editor
- Validation warning if a key color has no matching lock (or vice versa)

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts`, `EditorScene.ts`, `EditorSidebar.tsx`, `BootScene.ts`

---

### A5. Breakable Ice Block (Gelo Quebrável) ✅

**Tile type**: `ICE_BREAKABLE`

**Behavior**:
- Solid block that looks like a frozen/cracked ice block
- Breaks when hit by fireball (Fire Flower power-up)
- Can also break after 3 consecutive player jumps on top
- Breaking animation: shatter into ice particles
- Unlike FAKE_GROUND: doesn't break from standing, only from active hits
- Can hide coins, keys, or other items inside (spawned on break)

**Editor integration**:
- Add to "Interactive" palette category
- Editor property: what drops when broken (nothing, coin, key, power-up)

**Files to modify**: `constants.ts`, `GameScene.ts`, `EditorScene.ts`, `BootScene.ts`

---

### A6. Wind/Air Currents (Correntes de Ar) ✅

**Tile types**: `WIND_UP`, `WIND_DOWN`, `WIND_LEFT`, `WIND_RIGHT`

**Behavior**:
- Zone tiles (non-solid, like WATER or GRAVITY_ZONE)
- Push force: 2 pixels/frame in the wind direction
- Stacks with player movement (additive)
- Affects enemies too (pushes goombas around)
- Wind UP can create hovering/floating sections
- Visual: animated directional particle streaks inside the wind zone
- Different from conveyors: works in air, not just on ground

**Editor integration**:
- Add to "Interactive" palette category
- Directional arrow overlay in editor

**Files to modify**: `constants.ts`, `GameScene.ts` (apply force in update loop), `EditorScene.ts`, `BootScene.ts`

---

### A7. Mirror Block (Bloco Espelho) ✅

**Tile type**: `MIRROR`

**Behavior**:
- Solid reflective block
- When hit by player's fireball: reflects the projectile 90° (or bounces back)
- Reflected fireballs can hit enemies, break ICE_BREAKABLE, or activate switches
- Mirror orientation: horizontal or vertical (determines reflection angle)
- Creates ricochet puzzles: player must angle fireballs through mirror chains
- Visual: shiny metallic surface with specular highlight animation

**Editor integration**:
- Add to "Interactive" palette category
- Click to toggle orientation (horizontal/vertical)

**Files to modify**: `constants.ts`, `GameScene.ts` (fireball reflection logic), `EditorScene.ts`, `BootScene.ts`

---

## B. New Enemies & Bosses

### B8. Ghost Enemy (Fantasma / Boo) ✅

**Entity type**: `GHOST`

**Behavior**:
- Moves toward the player at 1.5 px/frame ONLY when the player is NOT facing it
- Freezes in place when the player faces it (player sprite direction check)
- "Facing" = player's last horizontal movement direction
- Does not collide with walls or platforms (floats through everything)
- Cannot be killed by jumping (passes through player from above)
- CAN be killed by Star power-up or fireball
- Visual: semi-transparent sprite that becomes solid/visible when moving, fades when frozen
- Troll potential: place behind the player's starting direction

**Editor integration**:
- Add to "Entities" category alongside other enemies
- Place like any other enemy entity

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts` (AI behavior in enemy update), `EditorScene.ts`, `BootScene.ts`

---

### B9. Shooter Enemy (Inimigo Atirador) ✅

**Entity type**: `SHOOTER`

**Behavior**:
- Stationary enemy that doesn't patrol
- Fires a projectile horizontally every 90 frames (1.5 seconds)
- Projectile speed: 3 px/frame
- Projectile destroyed on solid tile contact
- Shooting direction: faces toward player's last known position (or fixed left/right)
- CAN be killed by jump on head (like Goomba)
- CAN be killed by fireball or Star
- Visual: turtle-like enemy with a cannon on back; projectile is a small energy ball

**Editor integration**:
- Add to "Entities" category
- Place with initial facing direction (left/right)

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts`, `EditorScene.ts`, `BootScene.ts`

---

### B10. Mini-Boss (Goomba Gigante) ✅

**Entity type**: `GIANT_GOOMBA`

**Behavior**:
- 3× the size of normal Goomba (66×84 pixels)
- Health: 3 hits (jump on head)
- Each hit: boss flashes red, becomes temporarily invulnerable (60 frames)
- Speed: 1.0 px/frame (slower than regular Goomba)
- Shakes screen on each step (subtle)
- On death: explodes into coins (5-10 coins scattered)
- Immune to fireballs (only head-stomp or Star kills)
- Visual: angry oversized Goomba with battle-worn texture

**Editor integration**:
- Add to "Entities" category
- Limit 1 per level (for performance and design)
- Shows health bar above when hit

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts` (boss AI + HP system), `EditorScene.ts`, `BootScene.ts`

---

### B11. Saw Blade (Serra Circular) ✅

**Entity type**: `SAW_BLADE`

**Behavior**:
- Circular spinning blade that follows a predefined path
- Lethal on touch (like spikes, instant death)
- Path defined by waypoints in editor (minimum 2 points)
- Speed: 2 px/frame along path
- Continuously loops path (ping-pong or circular)
- Cannot be destroyed by any means
- Visual: spinning metal disc with teeth, rotation animation

**Editor integration**:
- Add to "Danger" category
- Path editing mode: click to place waypoints, the saw follows them in order
- Show path preview lines in editor
- Store path as array of {x, y} coordinates in level data

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts` (path-following system), `EditorScene.ts` (waypoint editor), `BootScene.ts`

---

## C. Editor Features

### C12. Layer System (Background/Foreground) ✅

**Concept**: Two distinct layers in the editor

**Behavior**:
- **Foreground layer** (default): All interactive/solid tiles, enemies, items
- **Background layer**: Decorative tiles that render behind everything, no collision
- Player and entities always render between layers
- Background tiles are slightly darkened/transparent (30% opacity reduction) for visual depth
- Toggle active layer with a button or hotkey (L key)
- Both layers visible in editor; active layer is highlighted, inactive is dimmed

**Editor integration**:
- Layer toggle button in EditorToolbar
- Current layer indicator in HUD
- Background palette: all decoration tiles + terrain tiles (used as backdrop)
- Level data format: add `background_tiles` 2D array alongside existing `tiles`

**Files to modify**: `types.ts` (LevelData), `GameScene.ts` (render background), `EditorScene.ts` (layer system), `EditorToolbar.tsx`, `EditorSidebar.tsx`

---

### C13. Copy/Paste Regions ✅

**Concept**: Select, copy, and paste rectangular regions of tiles

**Controls**:
- **Ctrl+C mode**: Enter selection mode → click-drag to select rectangle
- **Ctrl+V**: Paste copied region at cursor position
- **Escape**: Cancel selection
- Selection shows animated dashed border
- Copies all tiles AND entities within the rectangle
- Paste respects current layer

**Editor integration**:
- Selection overlay rendering in EditorScene
- Clipboard stored in memory (not system clipboard)
- Also support Ctrl+X (cut: copy + clear original)

**Files to modify**: `EditorScene.ts` (selection + clipboard logic), `EditorToolbar.tsx` (copy/paste buttons)

---

### C14. Templates/Prefabs ✅

**Concept**: Save and reuse tile combinations

**Behavior**:
- Player selects a region → "Save as Prefab" button
- Prefab gets a name and thumbnail
- Prefabs stored in localStorage
- Prefab palette section in editor sidebar
- Click prefab → enters paste mode at cursor
- Default prefabs included: basic platform, spike pit, cannon tower, lava bridge

**Editor integration**:
- New "Prefabs" tab in EditorSidebar
- Save/delete/rename prefab actions
- Preview thumbnail for each prefab
- Import/export prefabs as JSON (future: share with community)

**Files to modify**: `EditorScene.ts`, `EditorSidebar.tsx` (prefab panel), new `lib/prefabs.ts` for storage

---

### C15. Level Resize ✅

**Concept**: Adjust level dimensions beyond default 200×15

**Behavior**:
- Default: 200 tiles wide × 15 tiles tall
- Resize range: width 50-500, height 10-30
- Resize dialog accessible from EditorToolbar
- Expanding: adds empty space to right/bottom
- Shrinking: warns about tile loss, requires confirmation
- Camera bounds update to match new dimensions
- Game physics boundaries update accordingly (death pit at new bottom)

**Editor integration**:
- "Resize Level" button in EditorToolbar
- Modal dialog with width/height inputs + preview
- Level data stores dimensions explicitly

**Files to modify**: `constants.ts` (make dimensions configurable), `types.ts` (LevelData), `EditorScene.ts`, `EditorToolbar.tsx`, `GameScene.ts` (bounds)

---

### C16. Auto-Test Validation (Publish Requirement) ✅

**Concept**: Require the creator to complete the level before publishing

**Behavior**:
- When clicking "Publish", check if creator has completed a test run
- Test run: play the level from start to flag without cheats
- On successful completion: level gets `validated: true` flag
- Only validated levels can be published
- If level is edited after validation: re-validation required
- Toast message: "Você precisa completar o nível antes de publicar!"

**Editor integration**:
- "Test & Validate" button (separate from quick-test T key)
- Validation badge shown in editor toolbar when validated
- Publish button grayed out until validated
- Track validation state in editor state

**Files to modify**: `EditorScene.ts` (validation tracking), `EditorToolbar.tsx` (publish flow), editor `page.tsx`

---

## D. Social & Competitive Features

### D17. Replay Ghosts ✅

**Concept**: Record and display ghost replays of the best run on each level

**Behavior**:
- Every completed run: record player position (x, y) + direction each frame
- On level completion: if time is personal best, save ghost data
- When replaying the level: show a semi-transparent "ghost" player following the best run
- Ghost is non-interactive (no collision, purely visual)
- Toggle ghost on/off in play HUD
- Optionally show the level's OVERALL best ghost (from any player)

**Data storage**:
- Ghost data: array of `{x, y, frame}` compressed (delta encoding)
- Store in `level_plays` table as `ghost_data` column (JSONB, nullable)
- Only store top ghost per level globally + personal best per user

**Files to modify**: `GameScene.ts` (record + render ghost), `types.ts`, API route `/api/levels/[id]/ghost`, database schema

---

### D18. Weekly Challenges ✅

**Concept**: Curated weekly level challenge with bonus rewards

**Behavior**:
- Every Monday: a new community level is selected as "Weekly Challenge"
- Selection criteria: medium difficulty, 50+ plays, 3+ likes, not previously featured
- Players who complete the weekly challenge earn 2× coins
- Special badge on the level card: "Desafio da Semana"
- Leaderboard for weekly challenge: fastest completion time
- History of past weekly challenges accessible

**Implementation**:
- Cron job or admin action to select weekly level
- New DB column: `weekly_challenge_date` on levels table
- API route: `GET /api/levels/weekly` returns current challenge
- Homepage section: "Desafio da Semana" with countdown timer

**Files to modify**: API routes, `HomeLevelFeed.tsx`, `LevelCard.tsx`, database schema, possibly admin page

---

### D19. Level Tags ✅

**Concept**: Creator-defined tags for categorization and filtering

**Available tags**: `puzzle`, `speedrun`, `troll`, `precision`, `kaizo`, `easy`, `art`, `story`, `music`, `impossible`

**Behavior**:
- Creator selects 1-3 tags when publishing a level
- Tags displayed on LevelCard as colored chips
- Browse page: filter by tag (multi-select)
- Tags stored as `text[]` array in levels table
- Popular tags shown as quick-filter buttons on browse page

**Files to modify**: `LevelCard.tsx`, browse `page.tsx`, editor publish flow, API `/api/levels` (filter params), database schema

---

### D20. Collections/Playlists ✅

**Concept**: User-curated lists of levels

**Behavior**:
- Any user can create a collection with a name and description
- Add levels to collection from the level card ("Add to Collection" button)
- Collections are public and shareable via URL
- Collection page shows all levels in order with total stats
- Browse page: "Collections" tab
- Limit: 50 levels per collection, 10 collections per user

**Database**:
- New tables: `collections` (id, user_id, name, description, created_at) and `collection_levels` (collection_id, level_id, position)
- API routes: CRUD for collections

**Files to modify**: New API routes, new pages, `LevelCard.tsx` (add-to-collection action), database schema

---

### D21. Versus Mode (Race) 📋

**Concept**: Two players race through the same level simultaneously

**Behavior**:
- "Race" button on level page → creates a room with invite link
- Split-screen layout: two game canvases side-by-side (or top/bottom)
- Both players play the same level independently
- Real-time sync: show opponent's progress bar at top
- First to reach flag wins → victory screen with times
- If both die: independent respawn, timer continues
- Fallback if no opponent: race against ghost replay

**Technical approach**:
- WebSocket or Supabase Realtime for position sync
- Each player runs their own GameScene instance
- Only sync: position, alive/dead status, completion
- No physics interaction between players

**Files to modify**: New WebSocket/Realtime setup, new `RaceScene.ts`, play page UI, API for room management

---

### D22. Rating System (Stars) ✅

**Concept**: 1-5 star ratings on levels after completion

**Behavior**:
- After completing a level: prompt appears with 1-5 star selector
- Rating is optional (player can dismiss)
- Average rating displayed on LevelCard (e.g., ★★★★☆ 4.2)
- Only players who completed the level can rate (prevents rage-rating)
- One rating per user per level (can update)
- Minimum 5 ratings to show average publicly
- Used alongside likes for better curation/sorting

**Database**:
- New table: `level_ratings` (user_id, level_id, stars, created_at)
- Add `avg_rating` and `rating_count` to levels table (denormalized)

**Files to modify**: `LevelCard.tsx`, play page (post-completion modal), API routes, database schema

---

## E. Cosmetics & Progression

### E23. Achievements System ✅

**Concept**: Unlockable badges for milestones

**Achievement list**:

| ID | Name | Condition | Icon |
|----|------|-----------|------|
| `first_death` | Primeira Morte | Die 1 time | 💀 |
| `100_deaths` | Persistente | Die 100 times | 🪦 |
| `1000_deaths` | Imortal às Avessas | Die 1,000 times | ☠️ |
| `first_clear` | Primeiro Nível | Complete 1 level | 🏁 |
| `10_clears` | Explorador | Complete 10 levels | 🗺️ |
| `50_clears` | Veterano | Complete 50 levels | 🎖️ |
| `100_clears` | Lendário | Complete 100 levels | 👑 |
| `first_publish` | Criador | Publish 1 level | 🔨 |
| `10_publish` | Arquiteto | Publish 10 levels | 🏗️ |
| `speedster` | Velocista | Complete any level in under 10 seconds | ⚡ |
| `no_death_run` | Perfeito | Complete a level with 0 deaths | ✨ |
| `1000_coins` | Rico | Collect 1,000 total coins | 💰 |
| `campaign_done` | Herói da Campanha | Complete all campaign levels | 🏆 |
| `liked_100` | Popular | Get 100 total likes on your levels | ❤️ |
| `devs_choice` | Escolha dos Devs | Get a Dev's Choice feature | ⭐ |

**Behavior**:
- Check conditions after each play session and on profile load
- Toast notification with achievement unlock animation
- Achievement showcase on profile page (choose 3 to display)
- Achievements stored in `profiles` table as JSONB array

**Files to modify**: New `lib/achievements.ts`, `GameScene.ts` (check triggers), profile page, `RankUpToast.tsx` (reuse toast system), database schema

---

### E24. Custom Titles ✅

**Concept**: Text titles displayed under username

**Available titles** (unlock conditions):

| Title | Unlock |
|-------|--------|
| Novato | Default (free) |
| Mestre dos Trolls | Publish 20 troll-tagged levels |
| Velocista | Earn `speedster` achievement |
| Sobrevivente | Earn `1000_deaths` achievement |
| Arquiteto Supremo | Reach "Arquiteto" creator rank |
| Lenda Viva | Reach "Lenda" creator rank |
| Colecionador | Unlock 15+ cosmetics |
| Desafiante | Complete 10 weekly challenges |

**Behavior**:
- Select active title in profile settings
- Title shown on LevelCard author, creator profile page, and leaderboard
- Purchasable titles in shop (50-200 coins each) for extra variety
- Stored in `profiles.equipped_title` column

**Files to modify**: Profile/settings page, `LevelCard.tsx`, `lib/ranks.ts`, shop page, database schema

---

### E25. Victory Animations ✅

**Concept**: Custom celebration when completing a level

**Available animations**:
- `victory_default` — Cat jumps and waves (free)
- `victory_dance` — Cat does a little dance (30 coins)
- `victory_backflip` — Cat does a backflip (50 coins)
- `victory_fireworks` — Fireworks explode around cat (40 coins)
- `victory_dab` — Cat dabs (25 coins)
- `victory_troll_face` — Cat makes a troll face (60 coins)

**Behavior**:
- Plays for 2 seconds after touching the flag before showing completion screen
- Camera zooms slightly into player during animation
- Other cosmetics (skin, trail) still visible during victory
- Equipped in shop → stored in `profiles.equipped_victory`

**Files to modify**: Shop cosmetics data, `GameScene.ts` (victory sequence), profile/shop page, database schema

---

### E26. Level Themes/Skins ✅

**Concept**: Creator chooses a visual theme that reskins all tiles

**Available themes**:
- `theme_default` — Classic green/brown (free, current look)
- `theme_snow` — White/blue winter palette
- `theme_inferno` — Red/black volcanic palette
- `theme_neon` — Vibrant neon cyberpunk on dark background
- `theme_retro` — Muted green Game Boy style
- `theme_underwater` — Blue-green aquatic tones with bubble particles

**Behavior**:
- Selected by creator in editor before/during building
- Theme changes color palette of ALL terrain tiles procedurally
- Background color changes to match theme
- Ambient particles per theme (snowflakes, embers, bubbles, scanlines)
- Theme stored in level data: `theme: string`
- Player sees creator's chosen theme when playing

**Files to modify**: `BootScene.ts` (texture generation per theme), `GameScene.ts` (theme loading, ambient particles), `EditorScene.ts` (theme selector), `EditorToolbar.tsx`, `types.ts` (LevelData), `constants.ts` (theme palettes)

---

## F. Quality of Life & Fun

### F27. Slow Motion Power-Up ✅

**Entity type**: `POWERUP_SLOWMO`

**Behavior**:
- Collectible entity (like mushroom/star)
- On pickup: game speed reduces to 50% for 3 seconds (180 frames at 60fps)
- Affects everything: player, enemies, projectiles, animations
- Visual: screen gets a subtle blue tint during slowmo
- Sound: pitch-shifted down audio
- Useful for precision sections with tight timing
- Does NOT stack with other slowmo pickups (refreshes timer)

**Editor integration**:
- Add to "Entities" category alongside other power-ups
- Can be placed inside POWERUP_BLOCK or standalone

**Files to modify**: `constants.ts`, `GameScene.ts` (time scale system), `EditorScene.ts`, `BootScene.ts`

---

### F28. Custom Text Signs (Placas com Texto) ✅

**Tile type**: `SIGN_CUSTOM`

**Behavior**:
- Decorative tile that displays creator-written text
- When player overlaps the sign: text bubble appears above it
- Text auto-wraps, max 100 characters
- Text bubble has a pixel-art speech bubble style
- Disappears when player moves away
- Creator sets the text in editor via popup dialog

**Editor integration**:
- Add to "Decoration" palette category
- Double-click placed sign → text input dialog
- Preview text in editor tooltip on hover
- Store as special entity with `text` property in level data
- **Security**: sanitize text input (no HTML/scripts, only printable characters)

**Files to modify**: `constants.ts`, `types.ts`, `GameScene.ts` (text bubble rendering), `EditorScene.ts` (text editing dialog), `BootScene.ts`

---

### F29. Global Death Counter on HUD ✅

**Concept**: Show total community deaths on the level during gameplay

**Behavior**:
- Small skull icon + number in the play HUD: "💀 12,847"
- Shows how many total deaths ALL players have had on this level
- Updates in real-time-ish (fetched on level load, not live)
- Psychologically intimidating for hard levels
- Also show player's own death count for this session: "You: 💀 23"
- Optionally show completion rate: "42% completaram"

**Data source**: Aggregate from `level_plays` table (SUM of deaths where level_id matches)

**Files to modify**: `GameScene.ts` (HUD rendering), play page (data fetching), API route (aggregate query)

---

### F30. Custom Sound Effects on Triggers ✅

**Concept**: Creator attaches sound effects to troll triggers

**Available SFX**:
- `sfx_laugh` — Evil laugh
- `sfx_scream` — Dramatic scream
- `sfx_boom` — Explosion
- `sfx_horn` — Air horn (MLG style)
- `sfx_sad` — Sad trombone (wah wah)
- `sfx_fart` — Comedic sound
- `sfx_drama` — Dramatic reveal sting
- `sfx_bruh` — Bruh sound effect

**Behavior**:
- Attach to any troll trigger (existing `trolls` system in level data)
- New troll type: `sound` with `sfx` property
- Plays once when trigger X position is crossed
- Volume relative to player distance (spatial audio lite)
- Can combine with other troll effects (shake + sound, spawn + sound)

**Implementation**:
- SFX generated procedurally via Web Audio API (like existing audio system)
- Or use short base64-encoded audio clips embedded in code
- Editor: new troll trigger type "Sound Effect" with dropdown selector

**Files to modify**: `audio.ts` (new SFX synthesis), `GameScene.ts` (troll trigger handler), `EditorScene.ts` (troll editor), `types.ts`

---

## Implementation Priority (Suggested)

**Quick Wins** (small scope, high impact):
1. F29 — Global Death Counter (HUD only, data already exists)
2. D19 — Level Tags (simple DB + UI addition)
3. F28 — Custom Text Signs (standalone tile)
4. A6 — Wind Currents (similar to existing water/gravity zones)

**Medium Effort** (1-2 sessions each):
5. A1 — Teleporters
6. A2 — Cannons
7. B8 — Ghost Enemy
8. B9 — Shooter Enemy
9. A5 — Breakable Ice
10. F27 — Slow Motion Power-Up
11. F30 — Custom Sound Effects
12. E26 — Level Themes
13. C16 — Auto-Test Validation

**Large Effort** (multi-session):
14. A4 — Keys and Locks
15. B11 — Saw Blade (path editor)
16. C12 — Layer System
17. C13 — Copy/Paste
18. C14 — Prefabs
19. C15 — Level Resize
20. B10 — Giant Goomba Boss
21. E23 — Achievements System
22. D17 — Replay Ghosts
23. D22 — Rating System

**Major Features** (significant architecture):
24. A3 — Sticky Blocks
25. A7 — Mirror Block
26. D18 — Weekly Challenges
27. D20 — Collections
28. D21 — Versus Mode
29. E24 — Custom Titles
30. E25 — Victory Animations
