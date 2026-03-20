/**
 * Fallback testimonial data — mirrors the Strapi `testimonials` content type.
 *
 * Strapi fields (Week 1 schema):
 *   author_name, event_category, body, star_rating (1-5),
 *   is_featured (boolean), author_image (media, optional)
 *
 * Strapi endpoint:
 *   GET /api/testimonials?filters[is_featured][$eq]=true&sort=createdAt:desc
 */

export const TESTIMONIALS_FALLBACK = [
  {
    id: 0,
    documentId: null,
    author_name: 'Aditi Sharma',
    event_category: 'Corporate Event • Venue Decor',
    body: 'The team went above and beyond. Our annual summit looked spectacular, and the attention to detail was flawless.',
    star_rating: 5,
    is_featured: true,
    author_image: null,
  },
  {
    id: 1,
    documentId: null,
    author_name: 'Bhomick Kukreja',
    event_category: 'Birthday Party • House party Décor',
    body: "Booked my 28th birthday party décor through Elewen and felt completely at ease. Everything was delivered home, set up on time, and I didn't have to manage a thing.",
    star_rating: 5,
    is_featured: true,
    author_image: null,
  },
  {
    id: 2,
    documentId: null,
    author_name: 'Rahul Verma',
    event_category: 'Anniversary Dinner • Intimate Setup',
    body: 'Created the most magical evening for our 10th anniversary. The floral arrangements and lighting were breathtaking.',
    star_rating: 5,
    is_featured: true,
    author_image: null,
  },
  {
    id: 3,
    documentId: null,
    author_name: 'Priya Patel',
    event_category: 'Baby Shower • Theme Styling',
    body: "Absolutely beautiful pastel setup. The guests couldn't stop taking pictures, and the whole process was so smooth.",
    star_rating: 5,
    is_featured: true,
    author_image: null,
  },
]
