# Algomancer.gg Helper Scripts

This directory contains various helper scripts for the Algomancer.gg project. These scripts are not part of the main application but are used for data management, conversion, and other administrative tasks.

## Algomancy Card Scraper

The `scrapeAlgomancyCards.js` script scrapes card data from the Algomancy card game website and formats it to match the structure used in the Algomancer.gg project.

### Prerequisites

- Node.js (v14 or higher)
- npm

### Usage

Run the scraper:
```
npm run scrape
```

This will:
1. Launch a browser and navigate to the Algomancy cards website
2. Wait for the cards to load
3. Extract card data including names, images, and details
4. Process the data to match the required format
5. Save the data to `app/lib/data/algomancyCards.ts`

## Note

Most helper scripts are not tracked by Git. See `README_PRIVATE.md` for a complete list of all scripts and their documentation.
