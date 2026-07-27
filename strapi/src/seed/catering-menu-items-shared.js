'use strict';

/**
 * Reusable catering package menu row builders.
 * Each row maps to categories in catering-menu-data.js.
 */

function chooseRow({
  title,
  choose_hint,
  category_key,
  category_key_extra = null,
  max_pick,
  veg_pick = null,
  nonveg_pick = null,
  sort_order,
}) {
  const pick = Number(max_pick) > 0 ? Number(max_pick) : 1;
  return {
    title,
    choose_hint: choose_hint ?? (pick === 1 ? 'Choose 1' : `Choose ${pick}`),
    category_key,
    category_key_extra,
    row_type: 'choose',
    max_pick: pick,
    veg_pick,
    nonveg_pick,
    sort_order,
  };
}

function splitStarterRow(maxTotal, sort_order) {
  const half = maxTotal / 2;
  return chooseRow({
    title: `Starters (Choose ${half}+${half}) or ${maxTotal} veg`,
    choose_hint: `Choose ${half}+${half} or ${maxTotal} veg`,
    category_key: 'starters',
    category_key_extra: 'starters_non_veg',
    max_pick: maxTotal,
    veg_pick: half,
    nonveg_pick: half,
    sort_order,
  });
}

function splitMainRow(maxTotal, sort_order) {
  const half = maxTotal / 2;
  return chooseRow({
    title: `Main Course (Choose ${half}+${half}) or ${maxTotal} veg`,
    choose_hint: `Choose ${half}+${half} or ${maxTotal} veg`,
    category_key: 'main_course_veg',
    category_key_extra: 'main_course_non_veg',
    max_pick: maxTotal,
    veg_pick: half,
    nonveg_pick: half,
    sort_order,
  });
}

function breadsRow(sort_order, max_pick = 2) {
  return chooseRow({
    title: `Breads (Choose ${max_pick})`,
    category_key: 'rotis_and_rice',
    max_pick,
    sort_order,
  });
}

function riceRow(sort_order, max_pick = 1) {
  return chooseRow({
    title: `Rice (Choose ${max_pick})`,
    category_key: 'rice',
    max_pick,
    sort_order,
  });
}

function accompanimentsRows(sort_order, { breadPick = 2, ricePick = 1 } = {}) {
  return [breadsRow(sort_order, breadPick), riceRow(sort_order + 1, ricePick)];
}

function soupRow(sort_order, { title = 'Soup (Choose 1)', max_pick = 1 } = {}) {
  return chooseRow({
    title,
    category_key: 'soup',
    max_pick,
    sort_order,
  });
}

function prePlatedRow(sort_order) {
  return chooseRow({
    title: 'Pre-plated (Choose 1)',
    category_key: 'pre_plated',
    max_pick: 1,
    sort_order,
  });
}

function raitaRow(sort_order, max_pick = 1) {
  return chooseRow({
    title: max_pick > 1 ? `Raita (Choose ${max_pick})` : 'Raita / Yoghurt (Choose 1)',
    category_key: 'raita',
    max_pick,
    sort_order,
  });
}

function saladRow(sort_order, max_pick = 1) {
  return chooseRow({
    title: max_pick > 1 ? `Salad (Choose ${max_pick})` : 'Salad (Choose 1)',
    category_key: 'salad',
    max_pick,
    sort_order,
  });
}

function liveStationRow(sort_order, max_pick = 1) {
  return chooseRow({
    title: max_pick > 1 ? `Live Station (Choose ${max_pick})` : 'Live Station (Choose 1)',
    category_key: 'live_stations',
    max_pick,
    sort_order,
  });
}

function dessertRow(max_pick, sort_order) {
  return chooseRow({
    title: `Dessert (Choose ${max_pick})`,
    category_key: 'dessert',
    max_pick,
    sort_order,
  });
}

module.exports = {
  chooseRow,
  splitStarterRow,
  splitMainRow,
  breadsRow,
  riceRow,
  accompanimentsRows,
  soupRow,
  prePlatedRow,
  raitaRow,
  saladRow,
  liveStationRow,
  dessertRow,
};
