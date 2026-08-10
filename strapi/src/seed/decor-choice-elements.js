'use strict';

/**
 * Strip seed-only fields before persisting inclusions to Strapi.
 * Keeps `price_surcharge` (CMS-editable delta). Drops `_choice_amount`
 * (seed-only absolute price that is mirrored onto elements).
 */
function stripSeedOnlyInclusionFields(inclustions = []) {
  return inclustions.map(item => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const { _choice_amount, ...rest } = item;
    return rest;
  });
}

/**
 * Build package elements (one per choice option) from seed inclusion rows.
 * Elements are consumed in the same order as choice-group inclusions on the frontend.
 * Absolute `_choice_amount` path only — surcharges live on inclusion.price_surcharge.
 */
function buildChoiceElementsFromInclusions(inclustions = []) {
  return inclustions
    .filter(item => item?.is_choice_group && item._choice_amount != null)
    .map(item => ({
      title: item.text,
      base_price: item._choice_amount,
      visibility: true,
    }));
}

module.exports = {
  stripSeedOnlyInclusionFields,
  buildChoiceElementsFromInclusions,
};
