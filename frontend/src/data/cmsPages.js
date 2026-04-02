/**
 * Fallback content for CMS Single Type pages.
 * Used when Strapi is unavailable or before first fetch resolves.
 * These match the current hardcoded values exactly so the page
 * looks identical whether CMS loads or not.
 *
 * Structure mirrors what parseSections() returns:
 *   { [section_key]: content_json }
 */

export const LANDING_PAGE_FALLBACK = {
  hero: {
    eyebrow: "IT'S TIME TO",
    heading: 'PLAN DIFFERENTLY',
    search_line_1: 'Explore the collection. Your seamless',
    search_line_2: 'event is just a few clicks away!',
    left_taglines: ['Work made easy', 'Worth the spend', 'Well-vetted Vendors'],
    right_cards: [
      { label: 'Birthday', tagline: "Let's get this party going" },
      { label: 'Anniversary', tagline: 'Let us help you celebrate your love story' },
      { label: 'House Party', tagline: 'Turn your home into the party spot' },
    ],
  },
  plan_event_intro: {
    heading: 'Lets Start Planning',
    description:
      'Choose your event type and explore curated décor and catering packages designed to simplify planning.',
    cta_label: 'View All',
  },
  what_to_plan_intro: {
    heading: 'What would you like to plan',
    description: 'Choose a service category to explore curated packages designed for your event.',
    cta_label: 'View All',
  },
  checklist: {
    heading_1: 'Somewhere along the way,',
    heading_2: 'Hosting turned into Checklists.',
    chaos_items: [
      { title: 'Too much scrolling.' },
      { title: 'Too many calls.' },
      { title: 'Too many vendors.' },
      { title: 'Too many decisions.' },
    ],
    relief_heading: 'Stop take a deep breath',
    relief_items: [
      "You don't manage people",
      "You don't manage logistics",
      'No chasing vendors',
      'No waiting anxiously!',
    ],
    tagline: '11 takes the chaos out so you can stay in the moment',
    door_graphic: "You just open the door to a celebration that's already taken care of",
  },
  consultation_cta: {
    heading: 'Confused, Excited or somewhere in between?',
    body: "Drop your details, and we'll get in touch. You're just one call away from turning the confusion into a clear, sorted plan.",
    cta_label: 'Book a Consultation',
    cta_url: '/consultation',
  },
  better_way: {
    heading: 'The Perfect In-Between',
    left_label: 'when you hire a Planner',
    left_body:
      'Sometimes, booking an event planner feels overwhelming. There are layers of decisions, multiple meetings, and a budget that keeps growing with every addition. Sometimes, all you wanted was help making things look beautiful and knowing which vendors to trust.',
    right_label: 'when you DIY',
    right_body:
      "Doing it yourself sounds simple at first. But soon you're juggling vendor calls, comparing prices, managing deliveries, and trying to style everything the night before the event. What started as fun slowly becomes stressful. And instead of enjoying the celebration, you're busy making sure everything works well.",
    center_heading: '11',
    center_body:
      "Sometimes the solution is in between. We help you Plan Differently. You stay in control of your celebration. We simply make the process easier, more beautiful, and far less overwhelming. Where you get thoughtful styling and trusted vendors, without the pressure or the price of full-scale event planning. We're not too little. We're not too much. We're just right.",
  },
  packages_intro: {
    heading: 'Somewhere between Moodboards and reality, celebrations lost their feeling.',
    body: 'They became louder and Bigger, but less personal. Elewen exists to bring that feeling back. Not through more, but through meaning.',
    section_heading: 'OUR MOST LOVED PACKAGES',
  },
  planner_cta: {
    heading_1: 'Every celebration deserves its own feeling.',
    heading_2: 'Not another generic template',
    body: 'Want a professional to handle your event end to end? Fill the form and let our in-house planners plan it with you.',
    cta_label: 'Plan with Elewen',
    cta_url: '/in-house-planner',
  },
  blogs_intro: {
    heading_1: 'Planning Guides &',
    heading_2: 'Celebration Ideas',
    body: 'Helpful tips, inspiration, and practical guides to make planning your next celebration simpler.',
    cta_label: 'View All',
  },
  testimonials_intro: {
    heading: 'Real celebrations. Real experiences.',
  },
  instagram_section: {
    heading: 'Behind the Scenes',
    body: 'Follow along for real celebrations, styling ideas, and behind-the-scenes moments from the events we love creating. A little inspiration, a little planning help, and a lot of beautiful details.',
    cta_label: 'Join the instagram fam!',
  },
  vendor_partner: {
    heading: 'Partner with Elewen',
    body: "Great events are never created alone. We work with a trusted circle of florists, decorators, caterers, bartenders, and production houses who help bring celebrations to life. If you'd like to be part of our vendor network, we'd love to hear from you.",
    cta_label: 'Apply as a Vendor',
  },
}

export const ABOUT_PAGE_FALLBACK = {
  story_opening: {
    heading_1: 'When we saw Excitement',
    heading_2: 'Turning Into Overthinking',
    paragraphs: [
      'Elewen was born from noticing a simple truth: many people love the idea of hosting, but hesitate because planning an event often feels like too much to manage.',
      'Finding reliable vendors, understanding fair pricing, and coordinating everything usually means relying on social media, referrals, and endless back-and-forth.',
    ],
  },
  celebrations_matter: {
    heading: "Celebrations Don't Have to Be Big to Matter",
    paragraphs: [
      'Hosting a party, celebrating with close friends and family, and taking a pause from everyday life truly matters.',
      'Elewen exists to protect that feeling. We focus on the little details and personal touches that turn simple gatherings into meaningful moments.',
    ],
  },
  simple_question: {
    heading: 'We Asked a Simple Question',
    body: 'Almost everything else in our lives has moved online. We book cabs and holidays in minutes, so why does event planning still feel complicated?',
  },
  thoughtful_gatherings: {
    heading: 'Thoughtful Gatherings Over Loud Distractions?',
    paragraphs: [
      'With house parties becoming the new way to celebrate, it felt like the right time to bring digitalisation, organisation, and standardisation to the events space.',
      'Built on trust & to save time, Elewen is a one-stop digital platform that makes hosting simpler with genuine pricing, and seamless planning.',
      "And that's how Elewen came to be!",
    ],
  },
  founders: {
    heading: 'Meet the Founders',
    founders: [
      {
        name: "Hi! I'm Moksha",
        paragraphs: [
          "I still don't fully know how a formerly shy kid has turned into an adult who now builds experiences around people, conversations, and connection, but here we are.",
          "I've lived a large part of my life at a boarding school, The Lawrence School, Sanawar, which has shaped me into an independent, creative and confident person obsessed with structure (yes, I make checklists in my personal life too). An obsession that turned out to be a superpower in the events world.",
          "After doing a Msc. In International Events from the UK, and spending years in the industry, I knew I didn't want to build just another event management company. I wanted to create something bigger.",
          'So, I left my dream job, took a leap of faith and Elewen was born.',
        ],
      },
      {
        name: "Hey! I'm Gauri",
        paragraphs: [
          "I'm a dancer, reader, dreamer, and a believer that every little step eventually leads to the right place.",
          'I graduated from Ashoka university with an honours in economics and finance. Post-graduation, I was set to be buried in financial spreadsheets, but life had different plans.',
          'Elewen began as an idea my co-founder and I developed while exploring the opportunity to build a thoughtful, design-driven brand. Fast forward, and Elewen has grown into a full-time adventure, challenging me every day, keeping me on my toes and constantly inspired.',
        ],
      },
    ],
  },
  why_choose: {
    heading: 'Why Choose Elewen',
    subheading: 'Everything you need for a beautiful celebration, thoughtfully brought together.',
    features: [
      { label: 'Little details that lift your party', note: 'packages from ₹6k' },
      { label: 'One complete look. Zero running around.' },
      { label: 'A few clicks and you are done planning' },
      { label: "Behind the scenes? That's on us." },
    ],
  },
  vendor_quality: {
    heading: 'Our approach to vendor quality',
    body: 'We stand by the people behind every celebration, creating steady work, clear processes, and timely payments for vendors.',
    cards: [
      {
        title: 'Quality you can trust',
        description:
          'Every partner in the Elewen Network is quality-checked for skill, reliability, and consistency.',
      },
      {
        title: 'Built for everyone involved',
        description:
          'By removing middlemen, we give customers better value and help our partners work in a more organised, digital, and timely system.',
      },
      {
        title: 'Clear tiers. Simple Choices',
        description:
          'Our partners are grouped into three levels. You choose your package, and we take care of the rest.',
      },
    ],
  },
  vendor_cta: {
    heading: 'Not a part of the Elewen Network yet?',
    subheading: 'Come join the fam.',
    ctas: [
      { label: 'Customer Login', url: '/login' },
      { label: 'Join as Vendor', url: '/vendor-registration' },
    ],
  },
}

export const INHOUSE_PLANNER_PAGE_FALLBACK = {
  hero: {
    label: 'In House Event Planner',
    subtext: 'scroll to discover',
  },
  what_we_do: {
    heading: 'What we do as your In-House Planner',
    intro:
      'This option is for you if you want a professional handling everything end to end. From the first conversation to the final wrap-up, your planner handles it all.',
    bullet_points: [
      'Understanding your vision',
      'Concept & showflow planning',
      'Vendor management, coordination and production',
      'Styling and creative direction',
      'Timelines, approvals, and execution',
      "Being present so you don't have to worry",
    ],
  },
  moksha_bio: {
    greeting: "Hi, I'm Moksha.",
    intro:
      'Co-founder at Elewen and a professional event planner with 6+ years of industry experience. Trained in International Events in the UK, I bring structure, creativity, and calm to every celebration.',
    personal_note:
      "Some events call for personal attention and thoughtful detailing. They need intention, detail, and a planner who truly cares, that's exactly why the In-House Planner was created.",
  },
  grand_celebrations_intro: {
    heading_1: 'Experience, without the noise:',
    note: 'Executed during my tenure at Wizcraft and/or as a freelance project manager.',
  },
  celebrations_every_day: {
    heading: 'Celebrations We Plan Every Day',
    description:
      'From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and creative detail to social celebrations that matter most.',
    categories: [
      { tab_label: 'Anniversaries', heading: 'ANNIVERSARIES' },
      { tab_label: 'Birthday Parties', heading: 'BIRTHDAY PARTIES' },
      { tab_label: 'Engagement', heading: 'ENGAGEMENT' },
      { tab_label: 'Haldi', heading: 'HALDI' },
      { tab_label: 'Mehendi', heading: 'MEHENDI' },
      { tab_label: 'Weddings', heading: 'WEDDINGS' },
    ],
  },
  closing_cta: {
    heading: 'Tell Us About Your Celebration',
    body: "If you'd like me to plan your event end to end, leave your details and we'll take it from there.",
  },
}
