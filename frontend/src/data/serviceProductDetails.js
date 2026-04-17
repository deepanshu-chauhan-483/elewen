const DEFAULT_DETAILS = {
  intro:
    'A polished, beautifully styled setup designed to feel thoughtful from the first look to the final guest moment.',
  heroBadge: 'Signature Setup',
  keyDetails:
    'Built with considered styling, layered details, and flexible add-ons so the experience feels complete without becoming overwhelming.',
  whatsIncluded: [
    {
      title: 'Backdrop & styling',
      items: ['Feature backdrop', 'Styled accents', 'Tablescape details'],
    },
    {
      title: 'Guest touchpoints',
      items: ['Entry styling', 'Photo moments', 'Coordinated finishing details'],
    },
    {
      title: 'Flowers & decor',
      items: ['Fresh florals', 'Candles or ambient pieces', 'Balanced color story'],
    },
  ],
  configurableGroups: [
    {
      label: 'Backdrop style',
      options: ['Textured backdrop', 'Glitter backdrop', 'Panel backdrop'],
    },
    {
      label: 'Entry setup',
      options: ['Floral entrance', 'Balloon entrance', 'Statement welcome board'],
    },
    {
      label: 'Photo corners',
      options: ['Baby corner', 'Cake backdrop', 'Feature lounge corner'],
    },
  ],
  sections: [
    {
      title: 'The Nitty-Gritty',
      body: 'Setup timing, teardown flow, and handling notes are shared before confirmation so the delivery day stays calm and predictable.',
    },
    {
      title: 'The price you see covers it all',
      body: 'Core styling, standard setup, and the listed decor inclusions are bundled in the package price unless a custom add-on is selected.',
    },
    {
      title: 'Setup needs',
      body: 'We usually need venue access, one power point nearby if lighting is included, and a clear loading path for materials.',
    },
    {
      title: 'Best placed at',
      body: 'Works best for intimate celebrations, hosted dinners, milestone moments, and guest-focused gatherings with a clear photo area.',
    },
    {
      title: 'Why we love it',
      body: 'It feels elevated quickly and gives the event a focal point without demanding a full venue takeover.',
    },
    {
      title: 'Policies',
      body: 'Major customisations, reschedules, and venue restrictions should be shared in advance so we can plan the right production path.',
    },
    {
      title: 'Cancellation Policy',
      body: 'Cancellations close to the event date may affect refund eligibility because sourcing and production usually begin ahead of setup.',
    },
  ],
}

export const SERVICE_PRODUCT_DETAILS = {
  decor: {
    ...DEFAULT_DETAILS,
    heroBadge: 'Decor Package',
    intro:
      'An intimate, beautifully styled decor setup designed for slow conversations, shared laughs, and a hands-on party experience.',
    keyDetails:
      'A handcrafted decor story with soft florals, cozy seating, candlelight, and a table that invites guests to sit, sip, and stay awhile.',
    whatsIncluded: [
      {
        title: 'Backdrop',
        items: ['Bride-to-be arch', 'Large feature bow', 'Statement styling'],
      },
      {
        title: 'Dining setup',
        items: ['Low floor table', 'Runner styling', 'Floor cushions'],
      },
      {
        title: 'Florals & candles',
        items: ['Floral bunches', 'Table candles', 'Accent vases'],
      },
    ],
  },
  catering: {
    ...DEFAULT_DETAILS,
    heroBadge: 'Catering Package',
    intro:
      'A guest-friendly food service setup designed to keep the flow smooth from first bites to final plates.',
    keyDetails:
      'Menu planning, service format, and presentation details are grouped together so the hosting side feels lighter on the day.',
    configurableGroups: [
      {
        label: 'Service format',
        options: ['Live counters', 'Buffet spread', 'Plated service'],
      },
      {
        label: 'Guest add-ons',
        options: ['Welcome drinks', 'Dessert station', 'Late-night bites'],
      },
      {
        label: 'Presentation',
        options: ['Premium crockery', 'Styled stations', 'Menu signage'],
      },
    ],
  },
  bartending: {
    ...DEFAULT_DETAILS,
    heroBadge: 'Bartending Package',
    intro:
      'A polished bar experience shaped for easy guest movement, signature pours, and a clean service rhythm.',
    keyDetails:
      'Bar styling, bartender support, and beverage planning come together so the setup feels designed, not improvised.',
    configurableGroups: [
      {
        label: 'Bar style',
        options: ['Classic bar', 'Backlit bar', 'Compact cocktail station'],
      },
      {
        label: 'Drink menu',
        options: ['Signature cocktails', 'Mocktail menu', 'Mixed bar menu'],
      },
      {
        label: 'Extras',
        options: ['Glassware upgrade', 'Garnish bar', 'Welcome shots'],
      },
    ],
  },
  'rental-furniture': {
    ...DEFAULT_DETAILS,
    heroBadge: 'Furniture Package',
    intro:
      'Flexible furniture styling designed to shape the room, guide guest flow, and make every zone feel intentional.',
    keyDetails:
      'Seating, tables, soft furnishings, and feature pieces are selected to support both comfort and the visual language of the event.',
  },
  sheesha: {
    ...DEFAULT_DETAILS,
    heroBadge: 'Sheesha Package',
    intro:
      'A relaxed lounge setup designed for mellow guest moments, layered textures, and a social atmosphere that settles in naturally.',
    keyDetails:
      'The package balances comfort, presentation, and service flow so the lounge feels premium without becoming high-maintenance.',
  },
}

export function getServiceProductDetails(serviceSlug) {
  return SERVICE_PRODUCT_DETAILS[serviceSlug] ?? DEFAULT_DETAILS
}
