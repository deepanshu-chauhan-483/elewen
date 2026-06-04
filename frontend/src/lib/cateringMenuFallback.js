/** Offline fallback when Strapi catering-menu is unavailable (mirrors seed). */
export const CATERING_MENU_FALLBACK = {
  starters: [
    { name: 'Papdi Chaat', description: 'Crisp wafers with chutneys.', dietary: 'veg', sort_order: 1 },
    { name: 'Dahi Bhalla', dietary: 'veg', sort_order: 2 },
    { name: 'Hara Bhara Kebab', dietary: 'veg', sort_order: 3 },
    { name: 'Paneer Tikka', dietary: 'veg', sort_order: 4 },
  ],
  starters_non_veg: [
    { name: 'Chicken Tikka', dietary: 'non_veg', sort_order: 1 },
    { name: 'Mutton Seekh Kebab', dietary: 'non_veg', sort_order: 2 },
  ],
  main_course_veg: [
    { name: 'Paneer Butter Masala', dietary: 'veg', sort_order: 1 },
    { name: 'Dal Makhani', dietary: 'veg', sort_order: 2 },
    { name: 'Mix Vegetable Curry', dietary: 'veg', sort_order: 3 },
    { name: 'Kadai Paneer', dietary: 'veg', sort_order: 4 },
  ],
  main_course_non_veg: [
    { name: 'Butter Chicken', dietary: 'non_veg', sort_order: 1 },
    { name: 'Chicken Curry', dietary: 'non_veg', sort_order: 2 },
    { name: 'Rogan Josh', dietary: 'non_veg', sort_order: 3 },
  ],
  rotis_and_rice: [
    { name: 'Butter Naan', dietary: 'veg', sort_order: 1 },
    { name: 'Jeera Rice', dietary: 'veg', sort_order: 2 },
  ],
  dessert: [
    { name: 'Gulab Jamun', dietary: 'veg', sort_order: 1 },
    { name: 'Rasmalai', dietary: 'veg', sort_order: 2 },
    { name: 'Ice Cream (assorted)', dietary: 'veg', sort_order: 3 },
  ],
  pre_plated: [
    { name: 'Cheese & Crackers Platter', dietary: 'veg', sort_order: 1 },
    { name: 'Bruschetta Platter', dietary: 'veg', sort_order: 2 },
  ],
  soup: [{ name: 'Tomato Basil Soup', dietary: 'veg', sort_order: 1 }],
  rice: [{ name: 'Jeera Rice', dietary: 'veg', sort_order: 1 }],
  raita: [{ name: 'Boondi Raita', dietary: 'veg', sort_order: 1 }],
  salad: [{ name: 'Green Garden Salad', dietary: 'veg', sort_order: 1 }],
  live_stations: [{ name: 'Pasta Live Counter', dietary: 'veg', sort_order: 1 }],
}
