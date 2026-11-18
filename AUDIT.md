# Code audit and remediation

Scope: the React storefront/admin application, Express API, models, authentication, checkout/payment flow, DHL integration, uploads, email forms, build/deployment configuration and dependencies. Existing user changes to shipping/country support were preserved. No production data or provider settings were changed.

| Severity | Finding | Remediation |
| --- | --- | --- |
| Critical | Customer-supplied prices/totals could influence orders; payment state could be changed without provider verification. | Catalogue lookup, validated quantities/options, server totals, signed expiring quotes, removal of mock paid endpoint, signed PayHere notifications and owner-scoped initiation. |
| Critical | Old checkout relabelled EUR amounts as USD. | Explicit EUR throughout quote, order, hosted payment form, result and admin; configured shipping conversion rather than invented rates. |
| Critical | DHL debug data could reveal credentials; TLS verification was disabled. | No public raw SOAP/debug payloads, sanitized errors, XML escaping, verified TLS, bounded timeouts/responses. Credential rotation is still required. |
| High | Insecure Google authentication fallback and client-cached admin trust. | Verified Google ID tokens, verified email, database-backed profile/permissions, HTTP-only cookie session, deleted-user rejection and real logout. |
| High | Missing CSRF/origin controls, request limits and secure response headers. | Custom request header with origin checks, explicit CORS, Helmet/CSP, rate/body limits and private API caching. Signed payment notifications are the documented exception. |
| High | Public draft blog access and insufficient order ownership protection. | Admin-only draft listing, published-only public routes, ownership checks and private label downloads. |
| High | Query selector injection, unbounded inputs, password exposure and asynchronous error handling. | Primitive/type/range validation, recursive unsafe-key rejection, escaped search patterns, password excluded by default, Express async wrappers and generic error responses. |
| High | Default administrator password and destructive initialization utilities. | Explicit secret-based admin creation/reset, preserved records, guarded development deletion script and non-destructive blog seed. Existing admin credentials still need rotation. |
| High | Shipping failure could appear as zero delivery; parcel weight updates were lost. | Shipping failure blocks checkout, signed full-address quotes, persisted packed weight and selected carrier service. |
| High | DHL URLs were fixed to sandbox; booking retries could duplicate shipments. | Configurable approved live endpoints, live payment shipping guard, paid-only atomic booking claims and uncertain-response reconciliation. |
| High | Dependency advisories and unnecessary backend link to frontend package. | Compatible dependency updates, patched mail/parser packages, removed frontend link and PayPal dependency; lockfiles retained. |
| Medium | Cart was fragile across refresh/variants/payment returns. | Validated persistent cart, real product/variant IDs, bounded quantities, idempotent purchased-item clearing and storage-event synchronization. |
| Medium | Checkout recovery, totals, address validation and status messaging were unreliable. | Address review, explicit charged currency, quote invalidation/expiry, visible errors and server-polled payment result. |
| Medium | Admin totals represented only one page; fulfillment controls were incomplete. | Aggregate totals, paid-only delivery, shipment/label/pickup UI and visible loading errors. |
| Medium | Upload validation and error handling were weak. | Size/count limits, raster image allowlist and Cloudinary decoding/re-encoding; no arbitrary SVG uploads. |
| Medium | Contact form reported success without confirmed delivery. | Validated/rate-limited SMTP endpoint, success after provider acceptance, retained form content on failure. |
| Medium | Category definitions and admin edits could lose product/blog data. | Stored category validation, protected in-use categories, preserved editing fields and product option identifiers. |
| Medium | Excessive payloads, image assets and scroll event work. | Smaller existing WebP assets, excluded embedded label PDFs/reviews from lists, bounded lists, indexes, rate caching/deduplication, removed PayPal SDK, ticker cleanup and asynchronous prerender reads. |
| Medium | Keyboard/mobile/reduced-motion behavior and failure pages needed work. | Accessible dialog cart, visible focus, labelled inputs/quantity controls, mobile layout fixes, reduced-motion support, error boundary and usable 404. |
| Low | Stale product/article state and inconsistent navigation. | Ignore stale fetch responses, reset selected options/review state, corrected footer/category links and retained login return paths. |

## Admin dashboard and product editor

The admin workspace now has a responsive sidebar/mobile drawer, clearer overview cards, recent orders and an attention list backed by real totals. The initial overview requests only summary data and recent orders instead of loading all seven sections. Other sections load on demand, cache during the visit and provide refresh/retry controls. The product editor loads in a separate JavaScript chunk. Search, category/availability filters and twelve-item pages improve catalogue navigation within the existing 500-product API limit.

The new product editor groups required details, pricing/delivery, images and size options, with optional extra information and a desktop preview. It validates required fields and image type/size/count, preserves failed saves, prevents duplicate submissions and confirms before discarding edits. Admins can create a category within the editor, remove gallery images and clear optional intensity. Existing option IDs remain stable; options can have their own packed shipping weights, used by storefront estimates and server checkout calculations.

The API now validates product fields, categories, option ownership, prices and packed weights before uploading images. Cover images are required for new products; gallery limits are consistent between client and server. Whitelisted updates preserve omitted fields. Dashboard caching invalidates affected overview totals after mutations, including bulk deletion.

## Validation

Final verification on 2026-11-17 used Node.js 24.22.2:

| Check | Result |
| --- | --- |
| Backend unit/HTTP regression suite | 29 passed; no failures. |
| Production-browser regression suite (Microsoft Edge) | 17 passed; no failures. |
| TypeScript and Vite production build | Passed. |
| Frontend ESLint | Passed with no errors or warnings. |
| Backend npm dependency audit | 0 known vulnerabilities reported. |
| Frontend npm dependency audit | 0 known vulnerabilities reported. |

Backend coverage includes server-priced variants/quantities and packed weights, signed quotes, shipping failures, payment checksums, forged callbacks, repeated/late callbacks, owner/admin permissions, response headers and live-mode configuration. Product tests cover malformed inputs, create/update handlers, option IDs, image removal and clearing optional values. Browser coverage includes persisted carts, variant quantities, full-address checkout, provider form submission, failed shipping/contact delivery, payment result/cart behavior, mobile width, keyboard dismissal, 404 recovery and admin totals/fulfillment controls. Admin checks also cover on-demand loading/caching, product creation/editing, upload validation, failed-save recovery, duplicate-save prevention, unsaved-change confirmation and mobile navigation/editor layouts.

Automated tests intentionally use isolated fixtures rather than client database credentials or live provider accounts. No load-test score or production performance improvement percentage is claimed. Dependency audit results reflect the advisory service at the time of this run and should be rechecked before deployment.

Operational prerequisites and unverified integrations are detailed in [HANDOVER.md](HANDOVER.md). Deployment and successful real PayHere sandbox callback verification remain required before handover as a live store.
