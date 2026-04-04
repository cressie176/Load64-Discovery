# Load!64 POC

## About

This is the proof-of-concept implementation of Load!64. Its sole purpose is to validate the UX: screen designs, user journeys, and interaction patterns. See the parent `CLAUDE.md` at `../CLAUDE.md` for full project context, scope, and development standards.

## Commands

```bash
npm run dev       # start dev server
npm run check     # Biome lint + format check
npm run format    # Biome auto-format
npm test          # node:test suite (3s timeout, no concurrency)
./node_modules/.bin/tsc -b        # type check
```

## Source Structure

```
src/
  index.css                   # design tokens, base reset, and shared BEM blocks only
  router/                     # RouterContext — navigation stack (shared)
  store/                      # StoreContext — in-memory state and useStore hook (shared)
  types/                      # shared types only (e.g. types/router.ts)
  components/                 # shared UI components used across multiple screens
  screens/
    <feature>/                # one directory per wiki screen category
      <screen-name>/          # one directory per screen
        <ScreenName>.tsx      # screen component (imports ./index.css)
        <ScreenName>.test.ts  # co-located tests
        index.css             # BEM blocks owned by this screen
        types.ts              # domain types for this screen
        seed.ts               # seed data for this screen
```

Everything specific to a screen lives inside its screen directory. Only code that is genuinely shared across multiple screens belongs outside the screen directories.

Feature directories under `screens/` are created when their first screen is implemented, not upfront. The feature directory names mirror the wiki screen categories: `carousel`, `games`, `compilations`, `profiles`, `controllers`, `controller-families`, `controls`, `environment-variables`, `key-mappings`, `vice-arguments`, `snapshots`, `now-playing`, `import`, `admin`.

## Wiki

The wiki at `../Load64-wiki/` is the source of truth. Before implementing any screen:

1. Read `../Load64-wiki/Screens.md` to locate the screen spec
2. Read `../Load64-wiki/User-Experience.md` for navigation and interaction rules
3. Read the screen spec file, e.g. `../Load64-wiki/screens/carousel/Game-Carousel-Screen.md`

Screen spec files use this path pattern: `../Load64-wiki/screens/<category>/<Screen-Name>.md`

## Navigation Model

Navigation is a stack. Escape/Back always returns to the previous screen. The Carousel is the root — Escape does nothing there.

Screens are rendered by a central router component that maintains the navigation stack. Pushing a new screen navigates forward; popping returns back.

**Keyboard equivalents (used during development in place of a controller):**

| Action              | Controller    | Keyboard         |
|---------------------|---------------|------------------|
| Move in list        | D-Pad Up/Down | Arrow Up/Down    |
| Confirm / activate  | A / Select    | Enter            |
| Back / cancel       | Back          | Escape           |
| Context menu        | Button West   | —                |
| Cycle focus regions | Button North  | Tab / Shift+Tab  |

Tab moves between focus regions and top-bar CTAs — never through list items.

On entering any screen, focus lands on the primary content region, not the top-bar CTAs.

## Screen Anatomy

Every screen except the Carousel has a `[Back]` CTA in the top bar. The general layout is:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                      │
│  <Title>                                                    [CTA1]  [CTA2]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CONTENT REGION                                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM BAR                                                                   │
│  <status or hint>                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Top bar CTAs are right-aligned
- Focus enters the content region on screen load
- Tab reaches the top bar; Tab again wraps back to content

## State Management

All screens read from and write to the shared `StoreContext`. The store is initialised from seed data at startup and reset on page reload.

- Read state via `useStore()`
- Write state by calling `setStore(prev => ({ ...prev, <updated field> }))`
- The `Store` type in `StoreContext.tsx` grows as new feature areas are added

## Adding a Screen

1. Create only the screen asked for. Do not create other screens or unneeded files.
2. Read the wiki spec for the screen.
3. Create `src/screens/<feature>/<screen-name>/` and place all screen-specific files inside it:
   - `types.ts` — domain types for this screen
   - `seed.ts` — seed data for this screen
   - `index.css` — BEM blocks owned by this screen
   - `<ScreenName>.tsx` — screen component (imports `./index.css`)
   - `<ScreenName>.test.ts` — co-located tests
4. Extend the `Store` type in `src/store/StoreContext.tsx` if needed, importing types and seed from the screen directory.
5. Wire the screen into the router (`src/App.tsx` and `src/types/router.ts`).
6. Screens must be appropriately styled and work well on desktop (not just controller).

## Inherited Items

Screens that show inherited items (e.g. Control List, Environment Variable List) must visually distinguish inherited rows from owned rows — italics or muted colour. This treatment must be consistent across all such screens. Inherited rows are read-only; activating one opens the editor pre-populated with the parent's values so the user can create a local override.

## Text Truncation

All multi-column list rows must truncate overflowing text with a trailing ellipsis (`…`). Text must never wrap or cause layout overflow.

## Seed Data

Each screen's `seed.ts` file provides the initial data for that screen. Collectively, the seed data must contain enough to exercise every screen:

- Multiple compilations including "All Games" and "Favourites"
- Games with cover images, varied publishers, years, and ROM counts
- At least one multi-disk game
- Controllers with families
- Profiles with VICE arguments, key mappings, environment variables, and control assignments
- Import and admin data sufficient to navigate those screens

Use realistic C64 game titles and publisher names.
