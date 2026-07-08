'use strict';

/**
 * Strip seed-only fields before persisting inclusions to Strapi.
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
