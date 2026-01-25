# Default Beer Logo

This directory contains the default beer logo used when items don't have a thumbnail image.

## File Required

- **File name:** `beer-logo-default.jpg` (or `.svg`, `.jpg` depending on the format)
- **Source:** Vecteezy - vecteezy_beer-vector-logo_9108008_644
- **Author:** joko sutrisno
- **License:** Vecteezy Free License (requires attribution)

## Attribution

The logo is used under Vecteezy Free License. Attribution is included in:
- `public/index.html` (HTML comment)
- `src/utils/constants.ts` (code comment)

## Usage

The logo is automatically used as a fallback when:
- An item doesn't have a thumbnail in the database
- An item's thumbnail fails to load

The path is defined in `src/utils/constants.ts` as `DEFAULT_BEER_LOGO_PATH`.
