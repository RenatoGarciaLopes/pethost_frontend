# Listing route loading (29/10/2026)

Cold-cache behavior was updated in [loader-first-visit.md](loader-first-visit.md): actual embedded first frames replace the empty image state, then switch to animated WebPs after decoding. Reduced motion uses embedded images instead of canvas. The earlier description below of waiting for external assets is superseded by this correction.

## Purpose and implementation

The public listing route no longer wraps its async content in Suspense with a null fallback. That inner boundary previously hid the global loader while session, listing, reviews, pets, calendar and compatibility were pending.

- src/app/listings/[listingId]/page.tsx returns ListingPageContent directly. No request, permission, query or metadata contract changed.
- src/app/listings/[listingId]/loading.tsx re-exports the existing src/app/loading.tsx. Next owns this route-level Suspense boundary and can prefetch its fallback. No second loader component or artificial delay was introduced.
- src/app/layout.tsx calls React DOM preload for each TURMA_MEMBERS asset through the existing turmaSrc helper, with as=image and fetchPriority=high. Font preloading remains next/font/local. The door and flowers are inline SVG, so they do not require image downloads.
- src/shared/ui/brand/TurmaWalker/TurmaDog.tsx uses loading=eager and fetchPriority=high for animated WebP images. Reduced-motion canvas behavior is unchanged.

## Usage and limits

All application routes warm the three existing animated WebP assets (about 780 KiB total before caching) so navigation does not start their downloads only after loading begins. This is an intentional bandwidth/priority tradeoff requested for the complete loader. No duplicate assets, providers, preload registry or new shared API. Never block the loader itself on image decoding: its door, flowers and accessible status remain available during a slow image request. Preloading anticipates requests; it cannot guarantee completion before an immediate click on a slow connection.

The loader remains visible while route data is pending; a fully cached/instant route need not show it. This change does not impose a minimum spinner duration, alter browser error handling or make backend requests faster. Native route loading also depends on route code/prefetch availability; no claim of zero network latency. No manual Suspense with an empty fallback remains in this page.

## Validation

Applicable unit/functional tests: src/app/layout.test.tsx verifies all preload hints, src/app/listings/[listingId]/page.test.tsx covers the absence of the empty boundary, and loading.test.tsx in that route simulates pending/resolved content with the real application loader, all three eager/high-priority images, and one status announcement. src/app/loading.test.tsx covers normal/reduced motion. Existing page.int.test.tsx covers visitor rendering and data access; its resolver follows the new composition.

Execution results are recorded below after checks complete. Build and typecheck are static checks, not behavioral tests. Production browser navigation and real API latency are not covered by the simulated React Suspense regression; an E2E journey against the deployed site remains pending.

Validation completed: 11 tests in 5 files passed. Typecheck, ESLint, Prettier and Next 16.4.2/Turbopack production build passed (52 pages). Production E2E and real API validation remain pending. No push or deploy performed.
