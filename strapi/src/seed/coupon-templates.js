'use strict';

/** Global coupon templates — inactive by default until admin activates dates. */
const GLOBAL_COUPON_TEMPLATES = [
  {
    code: 'FIRST500',
    title: 'Flat Rs 500 off — First order',
    coupon_kind: 'first_order',
    discount_type: 'flat',
    discount_value: 500,
    min_order_value: 5000,
    first_order_only: true,
    terms_customer:
      'Flat Rs 500 off. Valid on orders above Rs 5,000. Valid on first order. Seafood is not included in catering menus at this level.',
    admin_notes: 'First-order welcome offer.',
  },
  {
    code: 'FIRST10',
    title: 'Flat 10% off — First order',
    coupon_kind: 'first_order',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 6500,
    max_order_value: 30000,
    first_order_only: true,
    terms_customer:
      'Flat 10% off. Valid on orders above Rs 6,500 and up to Rs 30,000. Valid on first order.',
    admin_notes: 'First-order percentage offer with order cap.',
  },
  {
    code: 'FIRST3000',
    title: 'Flat Rs 3,000 off — First order',
    coupon_kind: 'first_order',
    discount_type: 'flat',
    discount_value: 3000,
    min_order_value: 30000,
    first_order_only: true,
    terms_customer: 'Flat Rs 3,000 off. Valid on orders above Rs 30,000. Valid on first order.',
    admin_notes: 'High-value first-order offer.',
  },
  {
    code: 'DECOR1100',
    title: 'Flat Rs 1,100 off on Decor',
    coupon_kind: 'decor_monthly',
    discount_type: 'flat',
    discount_value: 1100,
    min_order_value: 5000,
    service_filter: 'decor',
    terms_customer:
      'Flat Rs 1,100 off on Decor services. Valid on orders above Rs 5,000. All decor orders above Rs 5,000 on the 11th of every month. For any user.',
    admin_notes: 'Decor monthly promo — activate manually on 11th.',
  },
  {
    code: 'ANY1000',
    title: 'Flat Rs 1,000 off',
    coupon_kind: 'public',
    discount_type: 'flat',
    discount_value: 1000,
    min_order_value: 5000,
    terms_customer: 'Flat Rs 1,000 off. Valid on orders above Rs 5,000. For any user.',
    admin_notes: 'General public offer.',
  },
  {
    code: 'FESTIVE5',
    title: 'Festive sale — 5% off',
    coupon_kind: 'festive',
    discount_type: 'percentage',
    discount_value: 5,
    min_order_value: 5000,
    terms_customer: 'Festive sale — 5% off. Valid on orders above Rs 5,000. For any user.',
    admin_notes: 'Festive campaign — activate dates manually.',
  },
  {
    code: 'SUMMER500',
    title: 'Summer sale — Rs 500 off',
    coupon_kind: 'seasonal',
    discount_type: 'flat',
    discount_value: 500,
    min_order_value: 5000,
    terms_customer: 'Summer sale — Flat Rs 500 off. Valid on orders above Rs 5,000. For any user.',
    admin_notes: 'Summer campaign — activate dates manually.',
  },
  {
    code: 'DIWALI1000',
    title: 'Diwali sale — Rs 1,000 off',
    coupon_kind: 'festive',
    discount_type: 'flat',
    discount_value: 1000,
    min_order_value: 5000,
    terms_customer:
      'Diwali sale — Flat Rs 1,000 off. Valid on orders above Rs 5,000. For any user.',
    admin_notes: 'Diwali campaign — activate dates manually.',
  },
];

async function findCouponByCode(strapi, code) {
  const rows = await strapi.documents('api::coupon.coupon').findMany({
    filters: { code: { $eq: code } },
    status: 'published',
    limit: 1,
  });
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function upsertCouponTemplate(strapi, template) {
  const payload = {
    code: template.code,
    title: template.title,
    coupon_kind: template.coupon_kind,
    discount_type: template.discount_type,
    discount_value: template.discount_value,
    min_order_value: template.min_order_value ?? 0,
    max_order_value: template.max_order_value ?? null,
    max_discount_amount: template.max_discount_amount ?? null,
    first_order_only: Boolean(template.first_order_only),
    service_filter: template.service_filter ?? 'all',
    terms_customer: template.terms_customer ?? '',
    admin_notes: template.admin_notes ?? '',
    is_user_specific: false,
    is_shareable: true,
    is_active: false,
    used_count: 0,
  };

  const existing = await findCouponByCode(strapi, template.code);

  if (existing?.documentId) {
    await strapi.documents('api::coupon.coupon').update({
      documentId: existing.documentId,
      data: payload,
    });
    await strapi.documents('api::coupon.coupon').publish({ documentId: existing.documentId });
    return { code: template.code, updated: true };
  }

  const created = await strapi.documents('api::coupon.coupon').create({
    data: payload,
    status: 'published',
  });

  return { code: template.code, created: true, documentId: created?.documentId ?? null };
}

async function seedCouponTemplates(strapi) {
  const results = [];
  for (const template of GLOBAL_COUPON_TEMPLATES) {
    results.push(await upsertCouponTemplate(strapi, template));
  }
  return results;
}

module.exports = { seedCouponTemplates };
