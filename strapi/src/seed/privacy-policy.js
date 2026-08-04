'use strict';

const PRIVACY_POLICY_UID = 'api::privacy-policy.privacy-policy';
const PUBLIC_FIND_ACTION = 'api::privacy-policy.privacy-policy.find';

const PRIVACY_POLICY_PAYLOAD = {
  title: 'Privacy Policy',
  effectiveDate: '2025-09-04',
  lastUpdated: '2025-09-04',
  contactEmail: 'info@elewen.co.in',
  governingLaw: 'India',
  jurisdiction: 'Delhi',
  sections: [
    {
      sectionNumber: 1,
      title: 'Information We Collect',
      clauses: [
        {
          content: 'When you use Elewen, we may collect the following information:',
          applicableTo: 'all',
        },
        {
          title: 'From Customers:',
          content:
            '• Name, email, and phone number\n• Event details (type, date, requirements, budget range)',
          applicableTo: 'customer',
        },
        {
          title: 'From Vendors:',
          content:
            '• Name, business details, email, phone number\n• Service listings and portfolio details\n• ID proof for verification (Aadhar, PAN, etc.)',
          applicableTo: 'vendor',
        },
        {
          title: 'Payments:',
          content:
            '• All payments are processed securely via Razorpay.\n• We do not store or process your card, UPI, or banking details.',
          applicableTo: 'all',
        },
        {
          title: 'Cookies & Analytics:',
          content:
            '• To improve your browsing experience, we may use cookies and Google Analytics.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 2,
      title: 'How We Use Your Data',
      clauses: [
        {
          content: 'We use your information strictly for:',
          applicableTo: 'all',
        },
        {
          content:
            '• Facilitating event bookings between customers and vendors\n• Secure payment processing via Razorpay\n• Communication related to bookings, reminders, and updates\n• Vendor verification and fraud prevention\n• Improving our platform and user experience',
          applicableTo: 'all',
        },
        {
          content:
            '➡️ We will never sell your data to advertisers or third parties. If we ever wish to use your data for marketing, we’ll ask for your permission first.',
          applicableTo: 'all',
          isHighlighted: true,
        },
      ],
    },
    {
      sectionNumber: 3,
      title: 'Sharing of Data',
      clauses: [
        {
          content: 'Your information may be shared only with:',
          applicableTo: 'all',
        },
        {
          content:
            '• Vendors – so they can deliver the services you booked\n• Razorpay – to securely process your payments\n• Legal/Regulatory authorities – only if required by law',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 4,
      title: 'Data Retention',
      clauses: [
        {
          content:
            '• We retain customer and vendor data indefinitely for records, analytics, and platform improvement.\n• If you wish to have your data deleted, you may email us at info@elewen.co.in, and we’ll process your request in line with Indian IT and DPDP regulations.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 5,
      title: 'Your Rights',
      clauses: [
        {
          content: 'You have the right to:',
          applicableTo: 'all',
        },
        {
          content:
            '• Request access to the data we hold about you\n• Request correction or deletion of your data\n• Opt out of cookies (via your browser settings)',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 6,
      title: 'Security Measures',
      clauses: [
        {
          content:
            'We use industry-standard security practices to protect your data, including:',
          applicableTo: 'all',
        },
        {
          content:
            '• Limited access to personal data within our team\n• Regular security audits',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 7,
      title: 'Cookies & Tracking',
      clauses: [
        {
          content: 'Elewen uses cookies for:',
          applicableTo: 'all',
        },
        {
          content:
            '• Login sessions\n• Analytics (Google Analytics)\n• Basic personalization',
          applicableTo: 'all',
        },
        {
          content:
            'You can disable cookies in your browser, but some features may stop working properly.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 8,
      title: 'Jurisdiction',
      clauses: [
        {
          content:
            'All disputes related to this Privacy Policy are governed by the laws of India, with exclusive jurisdiction in the courts of Delhi.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 9,
      title: 'Changes to Policy',
      clauses: [
        {
          content:
            'We may update this Privacy Policy from time to time. Any changes will be posted here with the updated “Effective Date.”',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 10,
      title: 'Contact Us',
      clauses: [
        {
          content:
            'If you have any questions about this Privacy Policy, write to us at:\ninfo@elewen.co.in',
          applicableTo: 'all',
        },
      ],
    },
  ],
  tldr: {
    heading: '🌟 Quick Summary',
    intro: 'At Elewen, your data is safe with us:',
    bullets: [
      {
        text: 'Payments are handled securely by Razorpay – we never see your card/UPI details.',
      },
      {
        text: 'Your info is only used for bookings & communication, not for ads.',
      },
      {
        text: 'We verify vendors with ID proof, but don’t guarantee licenses or quality.',
      },
      {
        text: 'You can request your data to be deleted anytime.',
      },
      {
        text: 'We use cookies for smooth browsing.',
      },
      {
        text: 'Everything is governed under Indian law (Delhi jurisdiction).',
      },
    ],
  },
};

async function findPublishedPrivacyPolicy(strapi) {
  const rows = await strapi.documents(PRIVACY_POLICY_UID).findMany({
    status: 'published',
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function ensurePublicFindPermission(strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole?.id) return;

  const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
    where: {
      action: PUBLIC_FIND_ACTION,
      role: publicRole.id,
    },
  });

  if (existing) return;

  await strapi.db.query('plugin::users-permissions.permission').create({
    data: {
      action: PUBLIC_FIND_ACTION,
      role: publicRole.id,
    },
  });

  strapi.log.info(`[seed/privacy-policy] Public find permission granted for ${PUBLIC_FIND_ACTION}`);
}

async function seedPrivacyPolicy(strapi) {
  const existing = await findPublishedPrivacyPolicy(strapi);

  if (existing?.documentId) {
    await strapi.documents(PRIVACY_POLICY_UID).update({
      documentId: existing.documentId,
      data: PRIVACY_POLICY_PAYLOAD,
    });
    const published = await strapi.documents(PRIVACY_POLICY_UID).publish({
      documentId: existing.documentId,
    });
    await ensurePublicFindPermission(strapi);
    return {
      updated: true,
      documentId: existing.documentId,
      entry: published?.entries?.[0] ?? existing,
    };
  }

  const draft = await strapi.documents(PRIVACY_POLICY_UID).findMany({
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]?.documentId) {
    await strapi.documents(PRIVACY_POLICY_UID).update({
      documentId: draft[0].documentId,
      data: PRIVACY_POLICY_PAYLOAD,
    });
    const published = await strapi.documents(PRIVACY_POLICY_UID).publish({
      documentId: draft[0].documentId,
    });
    await ensurePublicFindPermission(strapi);
    return {
      updated: true,
      documentId: draft[0].documentId,
      entry: published?.entries?.[0] ?? draft[0],
    };
  }

  const created = await strapi.documents(PRIVACY_POLICY_UID).create({
    data: PRIVACY_POLICY_PAYLOAD,
    status: 'published',
  });

  await ensurePublicFindPermission(strapi);

  return { created: true, documentId: created.documentId, entry: created };
}

module.exports = {
  seedPrivacyPolicy,
  PRIVACY_POLICY_PAYLOAD,
};
