# Load!64 POC

## About

This is the proof-of-concept implementation of Load!64. Its sole purpose is to validate the UX: screen designs, user journeys, and interaction patterns. See the parent `CLAUDE.md` at `../CLAUDE.md` for full project context, scope, and development standards.

## Commands

```bash
npm install       # install dependencies (required once per worktree — node_modules are not shared)
npm run dev       # start dev server
npm run check     # Biome lint + format check
npm run format    # Biome auto-format
npm test          # node:test suite (3s timeout, no concurrency)
./node_modules/.bin/tsc -b        # type check
```

**Worktrees:** Each git worktree needs its own `node_modules`. Run `npm install` once after creating a new worktree before running any other commands.

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
| Context menu        | Button West   | Option / Right-click |
| Cycle focus regions | Button North  | Tab / Shift+Tab  |

Tab moves between focus regions and top-bar CTAs — never through list items.

On entering any screen, focus lands on the primary content region, not the top-bar CTAs.

**Tab cycling implementation:** When Tab is pressed in the topbar, step through each CTA individually before returning to the content region. A common bug is toggling directly between `"list"` and `"topbar"` as a binary flip — this skips CTAs after the first. The correct pattern:
- Tab from content → topbar, focus first CTA (or last if Shift+Tab)
- Tab within topbar → move to next CTA; if no next CTA, return to content
- Always pass `event.shiftKey` to the toggle function to support reverse traversal

The correct implementation of `toggleFocusRegion` and its call site:

```ts
// In handleMainKey:
if (event.key === "Tab") {
  event.preventDefault();
  toggleFocusRegion(event.shiftKey);
  return;
}

// toggleFocusRegion:
function toggleFocusRegion(reverse = false) {
  if (focusRegion === "list") {
    const cta = reverse
      ? TOP_BAR_CTAS[TOP_BAR_CTAS.length - 1]
      : TOP_BAR_CTAS[0];
    setFocusRegion("topbar");
    setFocusedCta(cta as TopBarCta);
    focusCtaButton(cta as TopBarCta);
  } else {
    const currentIndex = TOP_BAR_CTAS.indexOf(focusedCta);
    const nextIndex = currentIndex + (reverse ? -1 : 1);
    if (nextIndex >= 0 && nextIndex < TOP_BAR_CTAS.length) {
      const nextCta = TOP_BAR_CTAS[nextIndex] as TopBarCta;
      setFocusedCta(nextCta);
      focusCtaButton(nextCta);
    } else {
      setFocusRegion("list");
      containerRef.current?.focus();
    }
  }
}
```

Use the screen-specific CTA array (e.g. `topBarCtas` when it varies by mode) in place of `TOP_BAR_CTAS` where appropriate.

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

### Keeping owner lists in sync

Several screens (Controls, Environment Variables, Key Mappings) resolve breadcrumb labels and inheritance by looking up an `ownerId` in their own `owners` array. If an entity is missing from that array the breadcrumb shows the raw ID and the screen renders empty.

**Rule:** every entity that can navigate to one of these screens must have a matching entry in that screen's `owners` array. Concretely:

- Every controller in `SEED_CONTROLLERS` must appear in `SEED_CONTROLS.owners` and `SEED_ENV_VARS.owners`.
- Every profile in `SEED_PROFILES` must appear in `SEED_KEY_MAPPINGS.owners` and `SEED_ENV_VARS.owners`.
- Every controller family must appear in `SEED_CONTROLS.owners` and `SEED_ENV_VARS.owners`.

**IDs must match exactly.** The `id` used in the controller/profile/family seed is what gets passed as `ownerId` through navigation. If the owner list uses a different string the lookup silently fails. When adding or renaming an entity, update every owner list that references it.

When adding a new controller, profile, or controller family, add the corresponding owner entry to all relevant seeds in the same change.
