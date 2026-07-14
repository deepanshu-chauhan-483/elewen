/**

 * Live CDN media URLs copied from production (elewen.co.in / Strapi / Cloudinary / R2).

 * Used by placeholderData and offline fallbacks so localhost matches live images.

 * When Strapi API is reachable, hooks return CMS URLs and these are not used.

 */

const PROD = 'https://elewen.co.in/assets'

export const LIVE_DEFAULT_IMAGE =
  'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777269295/2_5e0fbb1dee.png'

/** Production-hashed assets (same files live serves from its build). */

export const LIVE_STOCK_IMAGES = {
  img0749: `${PROD}/IMG_0749-BCBAOsal.jpg`,

  img3903: `${PROD}/IMG_3903-BSVZxfvm.jpg`,

  img3148: `${PROD}/IMG_3148-Cv5UF79g.jpg`,

  img0658: `${PROD}/IMG_0658-BdrvBVAc.jpg`,

  img7025: `${PROD}/IMG_7025-saZ19TM3.jpg`,

  img7768: `${PROD}/IMG_7768-BMVwnxPr.jpg`,

  img3001: `${PROD}/IMG_3001-BCeFQTvm.jpg`,

  img6f6af066: `${PROD}/6f6af066-B4rNC1RH.jpg`,

  img7646: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1776942652/IMG_7646_55c6a81189.jpg',

  stillUs:
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/630e1dade69118361c147ac90c60054e_80ca76ec20.jpg',

  floral:
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/8f4ec8b3_cb2e_42ba_9b1e_01171dd87821_c300845c6c.png',

  hookah: 'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/Hookah1_1_405889d875.png',
  corporateStage:
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/67bbc13b_2051_4a00_9afc_fdf4c25daeac_87ba34a021.png',
  privateCorner:
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/unnamed_6ba7b0ec12.jpg',
}

/** Blog covers when Strapi `cover_image` is null (Wedding/Corporate have no CMS cover yet). */

export const LIVE_BLOG_COVERS_BY_SLUG = {
  '5-wedding-decoration-trends-for-2025-you-need-to-know': LIVE_STOCK_IMAGES.stillUs,

  'how-to-plan-a-corporate-event-that-people-actually-enjoy': LIVE_STOCK_IMAGES.img3001,

  '10-ideas-for-a-perfect-birthday-party-at-home': LIVE_STOCK_IMAGES.img7646,
}

/** Same rotation as production CARD_LOCAL_IMAGES — all CDN, no bundled assets. */

export const LIVE_CARD_PLACEHOLDER_ROTATION = [
  LIVE_STOCK_IMAGES.img0749,

  LIVE_STOCK_IMAGES.img3903,

  LIVE_STOCK_IMAGES.img3148,

  LIVE_STOCK_IMAGES.img0658,

  LIVE_STOCK_IMAGES.img7025,

  LIVE_STOCK_IMAGES.img7768,

  LIVE_STOCK_IMAGES.floral,

  LIVE_STOCK_IMAGES.img6f6af066,

  LIVE_STOCK_IMAGES.img6f6af066,

  LIVE_STOCK_IMAGES.stillUs,

  LIVE_STOCK_IMAGES.img3001,

  LIVE_STOCK_IMAGES.img7768,

  LIVE_STOCK_IMAGES.img3903,

  LIVE_STOCK_IMAGES.img3148,

  LIVE_STOCK_IMAGES.img0658,
]

/** Package listing grids when Strapi package has no images (matches PKG_LOCAL_IMAGES layout). */

export const LIVE_PKG_PLACEHOLDER_GRIDS = [
  [LIVE_STOCK_IMAGES.img3903, LIVE_STOCK_IMAGES.img7768, LIVE_STOCK_IMAGES.img0749],

  [LIVE_STOCK_IMAGES.img0658, LIVE_STOCK_IMAGES.img3148, LIVE_STOCK_IMAGES.img7025],

  [LIVE_STOCK_IMAGES.floral, LIVE_STOCK_IMAGES.img6f6af066, LIVE_STOCK_IMAGES.img6f6af066],

  [LIVE_STOCK_IMAGES.img7768, LIVE_STOCK_IMAGES.img0658, LIVE_STOCK_IMAGES.floral],

  [LIVE_STOCK_IMAGES.img3148, LIVE_STOCK_IMAGES.img3903, LIVE_STOCK_IMAGES.img6f6af066],
]

export const LIVE_PKG_DECOR_GRIDS = [
  [
    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img3903,
  ],

  [
    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,
  ],

  [
    LIVE_STOCK_IMAGES.floral,

    LIVE_STOCK_IMAGES.img6f6af066,

    LIVE_STOCK_IMAGES.img6f6af066,

    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img7768,
  ],

  [
    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img0658,

    LIVE_STOCK_IMAGES.floral,

    LIVE_STOCK_IMAGES.img3148,

    LIVE_STOCK_IMAGES.img6f6af066,
  ],

  [
    LIVE_STOCK_IMAGES.img3148,

    LIVE_STOCK_IMAGES.img3903,

    LIVE_STOCK_IMAGES.img6f6af066,

    LIVE_STOCK_IMAGES.img0749,

    LIVE_STOCK_IMAGES.img7025,
  ],
]

export const LIVE_PKG_SHEESHA_GRIDS = [
  [
    LIVE_STOCK_IMAGES.hookah,

    LIVE_STOCK_IMAGES.hookah,

    LIVE_STOCK_IMAGES.hookah,

    LIVE_STOCK_IMAGES.hookah,

    LIVE_STOCK_IMAGES.hookah,
  ],

  [
    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,

    LIVE_STOCK_IMAGES.img7768,
  ],
]

export const LIVE_THEME_IMAGES = {
  floral: LIVE_STOCK_IMAGES.floral,

  'still-us': LIVE_STOCK_IMAGES.stillUs,

  'oh-baby':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/Floral_baby_sock_Centrepiece_2_941663ad3c.png',

  retro: LIVE_DEFAULT_IMAGE,

  disco: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777545321/3_5640cadfc5.png',

  bollywood: 'https://res.cloudinary.com/dqm4rqqdc/image/upload/v1777271380/15_7a510292ca.png',

  'a-little-honey':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/Floral_baby_sock_Centrepiece_2_941663ad3c.png',
}

export const LIVE_PACKAGE_IMAGES = {
  'av-tech-basics-1': LIVE_STOCK_IMAGES.floral,

  'av-tech-essential-kit-2':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/AV_and_Tech_Essential_Kit2_f85b4fc104.png',

  'stage-setup-2':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/67bbc13b_2051_4a00_9afc_fdf4c25daeac_87ba34a021.png',

  'exhibition-essentials-1':
    'https://pub-b2588c303cf24efabd0c47d36e96b965.r2.dev/uploads/08e52772_31e0_472d_a9f3_790b05eefa4e_d354d751b4.jfif',

  hookah: LIVE_STOCK_IMAGES.hookah,
}

export function liveThemeImage(slug) {
  const key = String(slug ?? '')
    .trim()

    .toLowerCase()

  return LIVE_THEME_IMAGES[key] ?? null
}

export function livePackagePlaceholderGrid(index, variant = 'default') {
  const grids =
    variant === 'decor'
      ? LIVE_PKG_DECOR_GRIDS
      : variant === 'sheesha'
        ? LIVE_PKG_SHEESHA_GRIDS
        : LIVE_PKG_PLACEHOLDER_GRIDS

  return grids[Number(index) % grids.length] ?? grids[0] ?? []
}

/** Prefer Strapi/CDN URL; never return bundled local asset paths. */

export function resolveLiveImage(primary, fallback = LIVE_DEFAULT_IMAGE) {
  const url = String(primary ?? '').trim()

  if (url.startsWith('http://') || url.startsWith('https://')) return url

  return fallback || null
}

/**

 * Blog cover: Strapi cover → blog_images[0] → slug CDN map → id-based CDN rotation.

 */

export function resolveBlogCover(blog) {
  const cover = String(blog?.cover_image ?? '').trim()

  if (cover.startsWith('http://') || cover.startsWith('https://')) return cover

  const firstImage = blog?.blog_images?.[0]

  const inlineUrl =
    typeof firstImage === 'string' ? firstImage : String(firstImage?.url ?? '').trim()

  if (inlineUrl.startsWith('http://') || inlineUrl.startsWith('https://')) return inlineUrl

  const slugCover = LIVE_BLOG_COVERS_BY_SLUG[String(blog?.slug ?? '').trim()]

  if (slugCover?.startsWith('http')) return slugCover

  if (blog?.id != null && LIVE_CARD_PLACEHOLDER_ROTATION.length > 0) {
    return LIVE_CARD_PLACEHOLDER_ROTATION[Number(blog.id) % LIVE_CARD_PLACEHOLDER_ROTATION.length]
  }

  return LIVE_DEFAULT_IMAGE
}
