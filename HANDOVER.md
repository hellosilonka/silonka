# Silonka client handover

The code now uses PayHere hosted checkout and server-verified payments. Local automated checks cover the critical purchase and permission paths. **Do not enable live payments until the staging acceptance checks below pass with the client's accounts.** The November catalogue import added nine products to the configured database; see [PRODUCT_IMPORT.md](PRODUCT_IMPORT.md). No deployment, real payment, shipment or email was performed.

## Configuration and local setup

Use Node.js 24.x, as declared in the root `package.json`. Install from the lockfiles:

```sh
npm ci --prefix backend
npm ci --include=dev --prefix app
```

Copy `backend/.env.example` to `backend/.env` and `app/.env.example` to `app/.env.local`, preserving any existing local configuration. Fill secrets through the deployment provider's secret settings in production. Never place secrets in `VITE_*` variables: those values are public browser code. Set `MONGO_URI` to an isolated development/staging database and use a random `JWT_SECRET` of at least 32 characters.

Run `npm run dev --prefix backend` and `npm run dev --prefix app` in separate terminals. Vite proxies `/api` to port 5000. Local HTTP supports browsing and account testing; PayHere callbacks require a public HTTPS staging host. Keep `CORS_ORIGINS` aligned with the actual frontend origin. Production is designed to serve the frontend and API on the same origin.

If startup rejects `JWT_SECRET`, generate a strong value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it as `JWT_SECRET` in `backend/.env`. Keep it private and stable between restarts; changing it signs out existing sessions. The server loads `backend/.env` regardless of the working directory, but values already set in the terminal or hosting environment take precedence. Keep `.env.example` free of credentials.

| Setting | Required value or action |
| --- | --- |
| `APP_URL`, `PUBLIC_API_URL` | Public HTTPS origins, without route paths. Normally identical. |
| `PAYHERE_MODE` | `sandbox` until acceptance is complete; then `live` with the corresponding merchant credentials. |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` | Credentials for the approved application/domain from the client's PayHere account. Backend only. |
| `DHL_MODE` | `sandbox` for testing; `live` after DHL certification. |
| DHL credentials and shipper fields | Fill every `DHL_SHIPPER_*` field with the actual exporting business details. |
| `DHL_RATE_ENDPOINT`, `DHL_SHIPMENT_ENDPOINT`, `DHL_PICKUP_ENDPOINT`, `DHL_TRACK_ENDPOINT` | Required in live mode. Obtain the production SOAP endpoints from DHL; sandbox endpoints are selected automatically. |
| `FX_<CURRENCY>_TO_USD` | Merchant-approved USD per unit of each currency returned by DHL, for example `FX_EUR_TO_USD`. Missing conversion blocks checkout. Review rates regularly. |
| `CHECKOUT_TAX_RATE` | Decimal fraction applied to merchandise, default `0`. Obtain the client's decision on prices, tax, duties and shipping taxation before launch. This is not a tax engine. |
| `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL` | Gmail sender, app password and enquiry recipient. Contact reports success only after SMTP accepts the email. |
| Cloudinary settings | Client-owned cloud name/API credentials. Test actual product and blog image uploads. |
| `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` | Matching client IDs, with the actual production/staging origins authorized in Google. Rebuild after changing the frontend value. |
| `TRUST_PROXY_HOPS` | `1` for the supplied Render configuration; `0` for direct local access. Match the real proxy topology. |

`render.yaml` uses reproducible installs, Node 24 through the root engine setting, a health check and sandbox defaults. It is a configuration template, not evidence of deployment. Select hosting that meets the client's availability requirements and test cold starts and callback delivery. Set production origins explicitly; do not retain local CORS origins.

## PayHere behavior

Catalogue prices and new checkout amounts are **USD**. The storefront defaults to USD without conversion. Checkout displays USD explicitly and calculates products, options, quantities, shipping and tax on the server. Other display currencies use illustrative estimates. Confirm that the client's PayHere account can accept USD. Historical order currencies are preserved; old orders without a currency are shown as unrecorded and excluded from USD revenue. Old EUR shipping quotes must be refreshed.

The shipping quote is bound to the customer, current catalogue, cart and full address, and expires after 15 minutes. Reusing the same quote reuses its order. The backend prepares the hosted payment form and keeps the merchant secret private. Only a valid signed notification with the correct merchant, amount and currency marks an order paid. Return/cancel URLs cannot mark it paid. Repeated notifications are idempotent; late failures cannot undo a payment. Chargebacks are recorded and block fulfillment.

The public notification endpoint is:

```text
POST https://YOUR_API_HOST/api/payment/payhere/notify
Content-Type: application/x-www-form-urlencoded
```

It must be accessible without browser login, challenges or redirects. Other unsafe API calls require the application request header and allowed origin. The payment result page checks the server's status and clears only purchased cart items after verified success. Pending payments require reconciliation before asking the customer to pay again. Refunds and payment investigation remain merchant operations in PayHere; this change does not add an automated refund API.

PayHere setup and checksum behavior follow the [official Checkout API documentation](https://support.payhere.lk/api-%26-mobile-sdk/checkout-api). DHL environment configuration follows the [official MyDHL SOAP documentation](https://developer.dhl.com/api-reference/mydhl-api-soap-dhl-express). Live payment initiation is blocked while DHL is still in sandbox mode or live endpoints are missing; payment notifications remain processable if shipping configuration becomes unavailable.

## Before handing over a live store

1. **Rotate previously exposed credentials.** The original public DHL debug output could expose request credentials. Rotate the DHL password, review exposure and carrier activity, and remove old debug deployments. Reset any administrator created using the old hardcoded seed password. Review old logs/repository history for secrets; rotate affected credentials without publishing their values. Rotate the JWT secret if it was weak or exposed, which signs users out.
2. Back up MongoDB and test restoration. Use a staging copy to verify existing products, customer accounts, orders and categories. New schema fields have defaults, but historical payment records must be reconciled with their provider rather than automatically marked paid or converted to PayHere.
3. Verify database indexes, especially the unique sparse `orders.checkoutKey` index, and the user/date order indexes. Verify there are no duplicate nonempty checkout keys before creating the unique index. Mongoose creates declared indexes under its default configuration; confirm this happened in the deployment database. Do not run destructive seed/reset scripts against client data.
4. Verify every product's price, availability, images, options and **packed shipping weight**. The product editor supports a base packed weight and an optional packed weight for each size/pack option. A blank option weight inherits the base weight. Checkout and product-page estimates use the selected option weight; verify every size before selling it. Availability is a boolean, not quantity-based inventory reservation; staff must maintain it.
5. Configure PayHere sandbox credentials and the approved public HTTPS domain. Configure DHL sandbox credentials, SMTP, Cloudinary, Google and any required currency conversion. Confirm `/api/payment/config` reports available with sandbox mode.
6. Complete the staging matrix below, including a real PayHere sandbox callback saved to the staging MongoDB. Local mocks do not replace this step.
7. Confirm approved production DHL endpoints/account, real shipper details, box sizes, carrier rates, customs declarations and booking behavior with DHL. The implementation retains the existing SOAP customs defaults; the client must validate them against the actual products and export process. Test certificates with verification enabled. If an additional trusted CA is needed, supply `NODE_EXTRA_CA_CERTS`; do not disable TLS validation.
8. Enable live credentials/modes only after the client approves operational setup. Run an authorized small-value live purchase, verify its settlement/order/label, and handle any refund through PayHere. Configure uptime/error monitoring, database backups, access ownership and merchant reconciliation.
9. Have the client approve contact details, shipping coverage, lead times, refund/return terms, privacy/cookie text and marketing claims. These existing business policies were not legally or commercially certified by this code audit.

| Staging check | Expected result |
| --- | --- |
| Email registration/login/logout; Google login if enabled | Valid session restored on refresh; logout invalidates browser access; non-admin denied admin APIs. |
| Product/options/quantities, refresh, mobile cart | Correct option and quantity; cart survives refresh; no mobile overflow or trapped keyboard focus. |
| Shipping quote, address edit, expired quote | Correct packed weight and destination; address/cart changes require a fresh quote; shipping failure blocks payment. |
| PayHere success | Callback updates MongoDB with matching provider payment ID and USD total; profile/admin reflect paid state. |
| Cancel, decline, pending/delayed callback | No false success; cart retained; delayed valid callback eventually confirms; do not retry uncertain payments blindly. |
| Refresh/revisit success, duplicate callback, amount tampering | No duplicate fulfillment/cart clearing; invalid signatures/amounts cannot change payment status. |
| Customer accessing another customer's order | Denied without leaking order details. |
| Admin image/category/product/blog changes | Saved data survives refresh; unpublished blog posts stay private; weights/options remain intact. |
| Paid order shipment, label, pickup, tracking | One booking per operation; valid label; correct address, weight and service; unpaid order cannot ship. |
| SMTP unavailable, invalid uploads, carrier failure | Clear actionable error, no false success, no credentials/raw provider responses returned. |

## Administration and recovery

Create the first admin explicitly with `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` (at least 12 characters, maximum 72 bytes), then run `npm run seed --prefix backend`. This preserves existing customers/products/orders and upserts default categories. Reset a known existing admin only with `npm run seed --prefix backend -- --reset-admin-password`. Remove the seed password from the deployment environment afterwards. No seed was run during this audit.

Shipment/pickup requests are claimed atomically before contacting DHL. A network timeout can mean the carrier accepted the request even though the response was lost. In this case the admin shows a reconciliation message and retains `dhl.shipmentCreating` or `dhl.pickupCreating`. Look up the order reference in DHL first. Record an existing AWB/confirmation, or have an operator clear the specific claim only after confirming no booking exists. Do not blindly retry or clear all claims.

PayHere records cannot be deleted through the order APIs. Keep them for payment reconciliation. A chargeback clears paid status and blocks new shipping; if goods are already shipped, staff must intervene. Backups and access to the merchant accounts remain the client's responsibility.

## Verification and limits

Commands from the repository root:

```sh
npm test --prefix backend
npm run lint --prefix app
npm run build --prefix app
npm run test:e2e --prefix app
npm audit --prefix backend
npm audit --prefix app
```

Browser tests use Microsoft Edge by default. Set `PLAYWRIGHT_CHANNEL=chrome` for installed Chrome, or configure an installed Playwright browser. The preview test server serves the production build without connecting to MongoDB. Backend tests use mocked model methods, and browser tests mock API/provider responses: neither suite makes real payments, sends emails or books shipments. The final results are recorded in `AUDIT.md`.

The audit improves the application but is not an independent penetration test, load test or guarantee that no defects remain. Verify production MongoDB behavior/indexes, concurrent checkout, actual provider callbacks, mail delivery, OAuth origins, uploads, carrier certification, and Safari/Firefox on staging. Product lists currently cap at 500, blogs at 200 and customer order history at 100; introduce server pagination before exceeding those limits. Rate limits are in memory and should move to a shared store before running multiple application instances. Cancellation/refund automation, stock reservation, password recovery and email verification are not implemented by this change.

## Redesigned admin workspace

Open `/admin` for the overview or `/admin?tab=products` for the catalogue. The overview fetches only totals and recent orders. Other sections load when opened, remain cached during that visit, and have an explicit Refresh action. Search, category/availability filters and twelve-product pages keep the catalogue manageable. Mobile navigation uses an accessible drawer.

Add or edit a product from Products. The editor groups details, pricing/delivery, images and options, with optional extra information and a desktop preview. A cover image, category, description, pack size, price and packed weight are required. Supported images are JPEG, PNG, WebP and AVIF, up to 5 MB each, with one cover and six gallery images. Existing products with more than six gallery images must be reduced to six when edited. Existing options retain their IDs; removed images and cleared optional intensity are saved correctly. Invalid input is rejected before cloud uploads. Failed saves keep the form open, duplicate save clicks are blocked, and closing unsaved work requires confirmation. Creating a category inside the editor saves that category immediately, even if the product is later discarded.

## November product catalogue

See [PRODUCT_IMPORT.md](PRODUCT_IMPORT.md) for the nine imported products, 30 options, sample USD prices, image optimization and repeatable import commands. All imported prices remain samples; packed weights are estimates. Review both in the admin product editor before launch. Five product photos are temporary generated references.
