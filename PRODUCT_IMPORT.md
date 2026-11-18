# Product import — 18 November 2026

Imported nine products and 30 selectable options into the configured MongoDB database. Existing customers, administrators and three historical unpaid orders were preserved.

| Product | Sample USD prices by option |
| --- | --- |
| Organic Ceylon Cinnamon Powder | 50 g: $4.50; 100 g: $7.50; 200 g: $13.50; 1 kg: $49.00 |
| Ceylon Cinnamon Bark Oil | 10 ml · 60–80% cinnamaldehyde: $12.00; 30 ml · 60–80% cinnamaldehyde: $29.00; 50 ml · 60–80% cinnamaldehyde: $44.00; 100 ml · 60–80% cinnamaldehyde: $79.00; 10 ml · More than 80% cinnamaldehyde: $16.00; 30 ml · More than 80% cinnamaldehyde: $37.00; 50 ml · More than 80% cinnamaldehyde: $56.00; 100 ml · More than 80% cinnamaldehyde: $99.00 |
| Ceylon Cinnamon Leaf Oil | 10 ml: $7.00; 30 ml: $16.00; 50 ml: $24.00; 100 ml: $42.00 |
| Ceylon Cinnamon Sticks (Alba) | 100 g: $12.00; 250 g: $26.00; 1 kg: $88.00 |
| Ceylon Cinnamon Candle | 200 g: $22.00 |
| Silonka CinnaChew — Cinnamon Wood Dog Chew | Small: $9.50; Medium: $12.50; Large: $16.50 |
| Silonka CinnaTug — Cinnamon Wood & Coco Rope | Small: $12.50; Medium: $16.50; Large: $21.50 |
| Silonka CinnaBeak — Cinnamon Wood Bird Perch & Chew | Small: $8.50; Medium: $11.50; Large: $15.50 |
| Silonka CinnaLedge — Cinnamon Wood Bird Platform | Small (5 cm): $8.00; Medium (7.5 cm): $11.00 |

## Source material

Descriptions come from the supplied DOCX files. Product specifications come from `products/details table.xlsx` and the pet product documents. The supplied WhatsApp options image defines pack sizes and the two bark-oil cinnamaldehyde ranges. Bark oil includes all eight combinations of size and strength. The candle has one 200 g pack.

## Images

All 26 supplied pet-product images were optimized, plus five generated reference images. The source images are unchanged. The options screenshot is source data, not a product photo.

- Web images: `app/public/products/` (31 WebP files, 2.68 MB total; 96.4% smaller than their 75.35 MB sources).
- Normal product photos: at most 1200 px on the longest edge, WebP quality 80.
- Size charts: at most 1600 px, WebP quality 88 for readable text.
- Five temporary reference originals and exact generation prompts: `products/reference/`. Created with the built-in imagegen tool.
- Source-to-image mapping and individual sizes: `backend/data/product-images.json`.
- Product pages show the selected variant photo; size charts remain in the gallery. One additional CinnaTug Small image is optimized on disk but omitted from the gallery to keep the six-image admin limit.

## Pricing and delivery

Prices are samples in USD. Each imported product has a sample-price checkbox in the admin editor. Clear it after finalizing the base price and every option price. Reference-image status can be cleared after uploading final photography. Packed shipping weights were not supplied; the import uses estimates and flags them in the editor. Replace these with measured packed weights for each option before fulfilling orders.

USD is the catalogue and checkout currency. Storefront USD prices are unchanged (rate 1); other display currencies use illustrative estimates. Shipping conversion uses `FX_<CURRENCY>_TO_USD`. Historical order currencies are not changed, and orders without a recorded currency are not assigned one. The dashboard revenue card sums paid USD orders only. Existing browser carts are reset by using a new USD storage key, and old EUR quotes require refresh.

## Repeatable commands

```sh
npm run images:products --prefix app
npm run import:products --prefix backend
npm run import:products --prefix backend -- --apply
```

The import defaults to validation only. `--apply` inserts products that do not already exist, retaining existing products by stable ID or exact name. Rerunning does not overwrite final prices, reviews, availability or option IDs. Product data is in `backend/data/product-import.json`.

No website deployment, payment, email or shipment was performed. The updated code and image assets must be deployed together for a hosted storefront.
