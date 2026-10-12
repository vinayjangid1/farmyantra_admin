import { WEBSITE_URL } from '@/core/config/env'
import { mediaUrl } from '@/services/files'

/** Built-in art lives on the website, uploads on the API server. */
export const posterImageUrl = (url) => (!url ? '' : url.startsWith('/graphics/') ? `${WEBSITE_URL}${url}` : mediaUrl(url))

/**
 * Every place on the website where a poster/slider can appear, with the
 * picture sizes that look best there. Order = order shown in the admin.
 */
export const PLACEMENTS = [
  { key: 'home_hero', page: 'Home', label: 'Main slider (top of home page)', max: 8, desktop: '2400 × 800 px (3:1)', mobile: '1080 × 1080 px (1:1)', ratio: { desktop: '3 / 1', mobile: '1 / 1' } },
  { key: 'home_promo', page: 'Home', label: '3 promo tiles (below the deals)', max: 3, desktop: '1200 × 600 px (2:1)', mobile: '1200 × 600 px (2:1)', ratio: { desktop: '2 / 1', mobile: '2 / 1' } },
  { key: 'home_strip', page: 'Home', label: 'Wide strip (after offers)', max: 5, desktop: '2400 × 400 px (6:1)', mobile: '1200 × 400 px (3:1)', ratio: { desktop: '6 / 1', mobile: '3 / 1' } },
  { key: 'home_middle', page: 'Home', label: '2 posters side by side (middle)', max: 2, desktop: '1200 × 600 px (2:1)', mobile: '1200 × 600 px (2:1)', ratio: { desktop: '2 / 1', mobile: '2 / 1' } },
  { key: 'home_bottom', page: 'Home', label: '2 posters (near the bottom)', max: 2, desktop: '1200 × 600 px (2:1)', mobile: '1200 × 600 px (2:1)', ratio: { desktop: '2 / 1', mobile: '2 / 1' } },
  { key: 'shop_top', page: 'Shop', label: 'Shop page — banner above products', max: 5, desktop: '2400 × 400 px (6:1)', mobile: '1200 × 500 px', ratio: { desktop: '6 / 1', mobile: '12 / 5' } },
  { key: 'category_top', page: 'Shop', label: 'Category pages — banner above products', max: 5, desktop: '2400 × 400 px (6:1)', mobile: '1200 × 500 px', ratio: { desktop: '6 / 1', mobile: '12 / 5' } },
  { key: 'product_promo', page: 'Product', label: 'Product page — poster under the buy box', max: 5, desktop: '1200 × 500 px', mobile: '1200 × 500 px', ratio: { desktop: '12 / 5', mobile: '12 / 5' } },
  { key: 'offers_page', page: 'Offers', label: 'Offers page — top banner', max: 5, desktop: '2400 × 800 px (3:1)', mobile: '1080 × 1080 px', ratio: { desktop: '3 / 1', mobile: '1 / 1' } },
  { key: 'account_top', page: 'Customer', label: 'Customer dashboard — banner', max: 5, desktop: '2400 × 400 px (6:1)', mobile: '1200 × 500 px', ratio: { desktop: '6 / 1', mobile: '12 / 5' } },
  { key: 'login_side', page: 'Customer', label: 'Sign-in page — side poster', max: 5, desktop: '900 × 1200 px (3:4)', mobile: '1200 × 500 px', ratio: { desktop: '3 / 4', mobile: '12 / 5' } },
]
export const placementMeta = (key) => PLACEMENTS.find((p) => p.key === key) || PLACEMENTS[0]

/** Built-in illustrations that ship with the website (no upload needed). */
export const BUILT_IN_ART = [
  ['tractor', 'Tractor'], ['sprayer', 'Sprayer'], ['tiller', 'Power tiller'], ['harvester', 'Harvester'],
  ['seed-drill', 'Seed drill'], ['brush-cutter', 'Brush cutter'], ['pump', 'Water pump'],
]

export const SWATCHES = ['#2874F0', '#172337', '#FFE11B', '#FB641B', '#2E9E52', '#7C5CFA', '#FFFFFF', '#F1F3F6']
