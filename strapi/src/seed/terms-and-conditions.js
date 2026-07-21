'use strict';

const TERMS_UID = 'api::terms-and-conditions.terms-and-conditions';
const PUBLIC_FIND_ACTION = 'api::terms-and-conditions.terms-and-conditions.find';

const TERMS_AND_CONDITIONS_PAYLOAD = {
  title: 'Terms & Conditions',
  version: '1.0',
  effectiveDate: '2025-09-04',
  lastUpdated: '2025-09-04',
  contactEmail: 'Elewen.events@gmail.com',
  governingLaw: 'India',
  jurisdiction: 'New Delhi, India',
  sections: [
    {
      title: 'Introduction',
      clauses: [
        {
          content:
            'Welcome to Elewen. Elewen is a platform through which customers can book event services.',
          applicableTo: 'all',
        },
        {
          content:
            'By using our platform and services, you agree to these Terms & Conditions. Please read them carefully.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 1,
      title: 'Our Role - Platform & Intermediary',
      clauses: [
        {
          clauseNumber: '1.1',
          content:
            'Elewen is a technology-enabled platform that curates, lists, and facilitates bookings between customers (“customers” or “clients”) and independent third-party vendors (“Vendors”). Elewen’s role is limited to acting as an intermediary and booking facilitator.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '1.2',
          content:
            'Elewen does not itself provide all event services. All services such as décor execution, catering, furniture supply, photography, bartending, etc., are provided by independent Vendors who are solely responsible for their performance.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '1.3',
          content:
            'Elewen conducts basic quality checks before onboarding Vendors. However, this does not constitute a guarantee, warranty, or legal responsibility for the Vendor’s actions or service quality.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '1.4',
          content:
            'While Elewen makes reasonable efforts to work only with trusted and verified Vendors, Elewen is not liable for any failure, delay, deficiency, misconduct, breach of contract, or negligence by a Vendor. The responsibility for service execution lies solely with the respective Vendor.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 2,
      title: 'Vendor Onboarding & Partnership Role',
      clauses: [
        {
          clauseNumber: '2.1',
          content:
            'Vendors working in collaboration with Elewen must submit accurate and authentic identification and business details.',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.2',
          content:
            'Elewen reserves the right to suspend, remove, or terminate any Vendor from its network if:\n• False, misleading, or incomplete information is provided\n• Repeated customer complaints are received\n• Service quality standards are not met\n• There is evidence of illegal or unethical conduct',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.3',
          content:
            'Elewen conducts a basic verification and quality screening process. This verification is for experience consistency and platform trust only. It does not constitute a legal certification or regulatory validation of the Vendor.',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.4',
          content:
            'Responsibility for:\n• Required licenses\n• GST registration\n• Insurance coverage\n• Compliance with all local or statutory laws\nlies solely with the Vendor.',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.5',
          content:
            'Vendors acknowledge that they operate as independent contractors and not as employees, agents, or partners of Elewen in a legal sense. Nothing in this agreement creates an employer-employee relationship, joint venture, or legal partnership.',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.6',
          content:
            'Vendors agree to:\n• Deliver services exactly as described by Elewen\n• Maintain professionalism, punctuality, and quality standards\n• Respect Elewen’s assigned on-ground representative as the final authority for coordination at the venue',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '2.7',
          title: 'Experience Ownership Clause',
          content:
            'Vendors acknowledge that Elewen owns the overall customer experience design, booking flow, and service structure. Vendors are contributors to that experience and must operate within Elewen’s service guidelines, branding tone, and execution standards.',
          applicableTo: 'vendor',
        },
      ],
    },
    {
      sectionNumber: 3,
      title: 'Booking and Payments',
      clauses: [
        {
          clauseNumber: '3.1',
          title: 'Advance Booking',
          content:
            'To confirm a booking on Elewen, the Customer is required to pay an advance amount through the platform. However, payment of the advance does not automatically guarantee confirmation of the booking. All bookings are subject to Vendor availability and internal confirmation by Elewen.\n\nElewen reserves the right to:\n• Accept or decline any booking request based on Vendor availability, operational feasibility, or quality standards\n• Refund a booking request if the Vendor is unavailable or the service cannot be executed as planned\n\nA booking shall be considered confirmed only after Elewen explicitly acknowledges and confirms receipt of payment and availability of the Vendor through official communication (email, WhatsApp, platform notification, or invoice confirmation).',
          applicableTo: 'customer',
        },
        {
          clauseNumber: '3.1.1',
          content:
            'Once Elewen receives the advance payment:\n• Elewen will deduct its commission from the advance (calculated on the total event value)\n• The remaining portion of the advance may be:\n  o Held by Elewen, or\n  o Partially/fully disbursed to the Vendor\nBased on the package structure, service requirements, and operational needs, as determined by Elewen.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '3.2',
          title: 'Commission and Platform Fee',
          content:
            'Elewen reserves the right to:\n• Charge a commission from Vendors, and\n• Charge a platform/service fee from Customers\n\nThese fees are charged for Elewen’s professional services, including curation, coordination, quality control, vendor management, and on-ground execution support.\n\nThe commission is calculated on the total event value as mutually agreed between the Vendor and Elewen through confirmed communication.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '3.3',
          title: 'Final Payment',
          content:
            'The remaining balance amount must be paid by the Customer to Elewen before the event begins.\n\nElewen does not permit any direct payments between Customers and Vendors.\n\nIf the Customer fails to complete the full payment:\n• Before the event begins, or\n• Before the booked service is completed (whichever is earlier),\nElewen reserves the absolute right to:\n• Withhold service execution\n• Withdraw the Vendor and assigned resources from the event site\n• Pause or cancel further service delivery\n\nIn all cases, the Customer is liable to pay 100% of the total booking amount for services already scheduled or executed.\n\nThe Customer has to pay 100% of the bill before the event starts / after completion of the booked service (whichever is earlier).',
          applicableTo: 'customer',
        },
        {
          clauseNumber: '3.4',
          title: 'Payment Protection Clause',
          content:
            'Elewen acts as the authorized payment collector on behalf of Vendors. By making payments through Elewen, Customers acknowledge that:\n• Payment to Elewen constitutes payment to the Vendor\n• Vendors are not authorized to request or accept any amount directly from Customers\n• Any direct payment made to Vendors is at the Customer’s own risk and will not be recognized by Elewen',
          applicableTo: 'customer',
        },
      ],
    },
    {
      sectionNumber: 4,
      title: 'Refund & Cancellation Policy',
      clauses: [
        {
          clauseNumber: '4.1',
          title: 'Customer Cancellation',
          content:
            'The below refund structure applies only if the event date is at least 4 days (96 hours) after the time of booking confirmation. For events scheduled within 4 days, Elewen reserves the right to apply stricter cancellation terms depending on Vendor commitments and preparation already initiated.\n\n• A full refund of the advance (excluding Elewen’s platform fee) will be issued if the cancellation is made within 16 hours of booking, whether initiated by the Customer or by Elewen.\n• If the cancellation is made after 16 hours and within 48 hours from the time of booking, a 50% refund of the advance amount (excluding Elewen’s platform fee) will be issued.\n• No refunds will be applicable for cancellations made after 48 hours from the time of booking, unless otherwise agreed in writing by Elewen under exceptional circumstances.\n• The timelines mentioned above are calculated from the exact time the booking was confirmed and the advance payment was received by Elewen.\n• Any services, preparations, Vendor commitments, or material sourcing initiated after confirmation will be taken into account while processing refunds.',
          applicableTo: 'customer',
        },
        {
          clauseNumber: '4.2',
          title: 'Elewen Cancellation',
          content:
            'Once Elewen confirms a booking, Elewen commits to fulfilling the service as agreed. Elewen shall not cancel a confirmed booking unless under unavoidable circumstances, including but not limited to:\n• Emergencies\n• Force majeure events\n• Serious operational constraints\n• Vendor unavailability despite best efforts\n\nIn such cases:\n• Elewen will immediately inform the Customer\n• A full refund of any amount paid will be initiated\n• Elewen may, at its discretion, offer an alternative Vendor or solution of similar value and quality',
          applicableTo: 'all',
        },
        {
          clauseNumber: '4.3',
          title: 'Vendor Cancellation',
          content:
            'If a Vendor cancels a confirmed booking without valid cause (as determined by Elewen):\n• The Vendor is obligated to refund the full advance amount received, plus an additional penalty of 30% of the total booking value to Elewen\n• This amount must be paid immediately upon cancellation\n\nFailure to comply may result in:\n• Immediate suspension or blacklisting from Elewen’s Vendor network\n• Legal recovery proceedings\n• Permanent termination of partnership\n\nElewen reserves full rights to recover damages caused to its reputation, operations, and customer trust due to Vendor default.',
          applicableTo: 'vendor',
        },
        {
          clauseNumber: '4.4',
          title: 'Refund Processing Time',
          content:
            '• Refunds initiated by Elewen will be processed within a reasonable time, typically up to 7 working days, from the date the refund becomes applicable and funds are available with Elewen.\n• Actual credit timelines may vary depending on:\n  o Banking systems\n  o Payment gateways\n  o Mode of payment used by the Customer\n\nElewen shall not be held responsible for delays caused by external financial institutions.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 5,
      title: 'No Bypass / Direct Contact Policy',
      clauses: [
        {
          clauseNumber: '5.1',
          content:
            'Customers and Vendors agree that all communication, negotiation, contracting, and payments for any service introduced or facilitated through Elewen must be conducted exclusively via Elewen’s platform and authorized communication channels.\n\nNeither party shall attempt to bypass, avoid, or circumvent Elewen by engaging in direct arrangements, bookings, payments, or agreements outside the platform where the initial connection, lead, or service discovery was made through Elewen.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '5.2',
          content:
            'Any Customer or Vendor found to be bypassing Elewen for the purpose of avoiding platform fees, commissions, or processes shall be deemed in material breach of these Terms.\n\nElewen reserves the right to, at its sole discretion:\n• Suspend or permanently terminate access to the platform\n• Blacklist the Customer or Vendor from future use or partnership\n• Remove Vendor listings and visibility\n• Cancel any active or future bookings without liability\n• Recover financial losses or damages caused due to such bypass',
          applicableTo: 'all',
        },
        {
          clauseNumber: '5.3',
          title: 'Continued Protection Clause',
          content:
            'This non-circumvention obligation shall remain valid even after:\n• Completion of a booking\n• Termination of a Vendor partnership\n• Deactivation of a Customer account\n\nAny future direct transactions arising from an introduction made through Elewen shall still be considered a breach of this policy.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 7,
      title: 'Customer Obligations',
      clauses: [
        {
          clauseNumber: '7.1',
          content:
            'Customers must provide accurate event details (date, venue, guest count, special requirements) and make payments as per the agreed terms with Elewen.',
          applicableTo: 'customer',
        },
        {
          clauseNumber: '7.2',
          content:
            'Customers must not bypass the platform to avoid platform fees or attempt direct contact with Vendors once the lead has been introduced through Elewen.',
          applicableTo: 'customer',
        },
      ],
    },
    {
      sectionNumber: 8,
      title: 'Disputes & Remediation',
      clauses: [
        {
          clauseNumber: '8.1',
          content:
            'If a dispute arises between a Customer and a Vendor, Elewen may act as a mediator to facilitate communication and resolution. Elewen’s role is mediation only; Elewen is not the arbiter of liability unless expressly agreed.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '8.2',
          content:
            'Elewen aims to acknowledge dispute reports within 48 hours of service completion.\n\nCustomers must provide proof (images and videos) of any quality or quantity breach of service by the Vendor.\nVendors must also keep proof of their completed work and the condition in which they left the event site.\n\nElewen will take into consideration both parties impartially and may choose to initiate a refund to the Customer in accordance with the refund process policy (refer to Section 4.4).',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 9,
      title: 'Limitation of Liability & Indemnity',
      clauses: [
        {
          clauseNumber: '9.1',
          title: 'Limitation of Liability',
          content:
            'To the maximum extent permitted by law, Elewen’s total liability arising out of or related to these Terms (including negligence) shall not exceed the total fees (platform/service fee) actually paid to Elewen in respect of the specific booking giving rise to the liability. Elewen is not liable for indirect, incidental, special, punitive, or consequential losses (including loss of profit or loss of reputation).',
          applicableTo: 'all',
        },
        {
          clauseNumber: '9.2',
          title: 'Indemnity',
          content:
            'Customers and Vendors agree to indemnify, defend, and hold Elewen, its officers, employees, and agents harmless from any claim, liability, loss, damage, or expense (including legal fees) arising from their use of the platform, their conduct during an event, or any third-party claims arising from the event (including accidents, property damage, personal injury, or breach of applicable laws).',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 12,
      title: 'Force Majeure',
      clauses: [
        {
          clauseNumber: '12.1',
          content:
            'Elewen shall not be liable for any failure or delay in performance caused by events beyond its reasonable control (e.g., natural disasters, government restrictions, strikes, pandemics, acts of God). In such cases, Elewen and the parties will work in good faith to reschedule or cancel bookings as per policy.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 13,
      title: 'Changes to Terms',
      clauses: [
        {
          clauseNumber: '13.1',
          content:
            'Elewen reserves the right to modify, update, or revise these Terms, policies, pricing, commissions, or platform structure at any time to reflect operational, legal, or business changes.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '13.2',
          content:
            'Any such changes will be posted on the Elewen website or communicated through official channels. Once published, the updated Terms shall become effective immediately or from the date stated. Continued use of the platform after changes implies acceptance of the revised Terms.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 14,
      title: 'Data & Privacy',
      clauses: [
        {
          clauseNumber: '14.1',
          content:
            'Elewen collects and uses personal information solely for:\n• Booking facilitation\n• Platform operations\n• Customer and Vendor communication\n• Service execution and support\n\nElewen does not sell, trade, or commercially exploit personal data. Information is used only to manage bookings, provide updates, resolve issues, and ensure smooth service delivery.\n\nFor detailed practices, users are advised to review Elewen’s Privacy Policy.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '14.2',
          content:
            'Customers and Vendors must not:\n• Misuse contact details obtained via Elewen\n• Contact each other for purposes unrelated to confirmed bookings\n• Use data for unsolicited marketing without consent\n• Engage in unlawful or unethical activity\n\nAny misuse of data may result in immediate suspension and legal action.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 15,
      title: 'Account Suspension & Termination',
      clauses: [
        {
          clauseNumber: '15.1',
          content:
            'Elewen reserves the right to suspend or permanently terminate any Customer or Vendor account without prior notice in cases including but not limited to:\n• Breach of these Terms\n• Non-payment or delayed payment\n• Repeated complaints or misconduct\n• Vendor unreliability\n• Bypass or direct dealing violations\n• Fraud, misrepresentation, or abuse of platform services',
          applicableTo: 'all',
        },
        {
          clauseNumber: '15.2',
          content:
            'Termination of access does not release any party from:\n• Outstanding payments\n• Refund liabilities\n• Penalties\n• Legal obligations or indemnities',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 16,
      title: 'Governing Law & Jurisdiction',
      clauses: [
        {
          clauseNumber: '16.1',
          content:
            'These Terms shall be governed and interpreted in accordance with the laws of India.',
          applicableTo: 'all',
        },
        {
          clauseNumber: '16.2',
          content:
            'Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.',
          applicableTo: 'all',
        },
      ],
    },
    {
      sectionNumber: 17,
      title: 'Contact & Support',
      clauses: [
        {
          clauseNumber: '17.1',
          content:
            'For support, disputes, refunds, or general assistance, please contact:\nElewen.events@gmail.com\n\nOr use the contact form available on the Elewen website.\n\nElewen will acknowledge all queries and make reasonable efforts to respond promptly and efficiently.',
          applicableTo: 'all',
        },
      ],
    },
    {
      title: 'Agreement',
      clauses: [
        {
          content:
            'By accessing or using Elewen’s platform, you confirm that you have read, understood, and agreed to these Terms and Conditions.\n\nIf you do not agree with any part of these Terms, you must refrain from using the platform or engaging with Elewen’s services.',
          applicableTo: 'all',
        },
      ],
    },
  ],
  tldr: {
    heading: 'THE FINE PRINT',
    intro:
      'TL;DR — Easy Terms for the booking page or a “Know before you book” popup. Elewen is a booking platform and intermediary. We connect you with verified vendors, manage coordination, and ensure smooth execution.',
    showOnBookingPage: true,
    bullets: [
      {
        text: 'Your booking is confirmed only after you pay the advance through Elewen.',
      },
      {
        text: 'Payments are made to Elewen, not directly to vendors. We release vendor payments after service completion and deduct our commission.',
      },
      {
        text: 'You must clear 100% of the event amount before the event starts (or immediately after service, whichever is earlier).',
      },
      {
        text: 'No direct dealing with vendors outside Elewen. Bypassing the platform can lead to suspension or blacklisting.',
      },
      {
        text: 'Cancellation & refunds (when the event date is at least 4 days after booking): Within 16 hours of booking → Full refund of advance (excluding platform fee). Between 16–48 hours → 50% refund of advance (excluding platform fee). After 48 hours → No refund.',
      },
      {
        text: 'If a vendor cancels, you get a full refund, and the vendor faces penalties.',
      },
      {
        text: 'We ensure coordination, on-time delivery, and quality checks, but vendors are responsible for their services.',
      },
      {
        text: 'Your personal data is safe and used only for booking and communication.',
      },
      {
        text: 'Elewen can suspend accounts for misuse, non-payment, or policy violations.',
      },
      {
        text: 'All disputes are governed under Indian law.',
      },
    ],
    closingNote:
      'In short: You book. You pay Elewen. We handle vendors, coordination, stress, and execution. No chasing, no chaos, no direct dealing. Just a smooth, doorstep celebration.',
  },
};

async function findPublishedTerms(strapi) {
  const rows = await strapi.documents(TERMS_UID).findMany({
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

  strapi.log.info(`[seed/terms-and-conditions] Public find permission granted for ${PUBLIC_FIND_ACTION}`);
}

async function seedTermsAndConditions(strapi) {
  const existing = await findPublishedTerms(strapi);

  if (existing?.documentId) {
    await strapi.documents(TERMS_UID).update({
      documentId: existing.documentId,
      data: TERMS_AND_CONDITIONS_PAYLOAD,
    });
    const published = await strapi.documents(TERMS_UID).publish({
      documentId: existing.documentId,
    });
    await ensurePublicFindPermission(strapi);
    return {
      updated: true,
      documentId: existing.documentId,
      entry: published?.entries?.[0] ?? existing,
    };
  }

  const draft = await strapi.documents(TERMS_UID).findMany({
    status: 'draft',
    limit: 1,
  });

  if (Array.isArray(draft) && draft[0]?.documentId) {
    await strapi.documents(TERMS_UID).update({
      documentId: draft[0].documentId,
      data: TERMS_AND_CONDITIONS_PAYLOAD,
    });
    const published = await strapi.documents(TERMS_UID).publish({
      documentId: draft[0].documentId,
    });
    await ensurePublicFindPermission(strapi);
    return {
      updated: true,
      documentId: draft[0].documentId,
      entry: published?.entries?.[0] ?? draft[0],
    };
  }

  const created = await strapi.documents(TERMS_UID).create({
    data: TERMS_AND_CONDITIONS_PAYLOAD,
    status: 'published',
  });

  await ensurePublicFindPermission(strapi);

  return { created: true, documentId: created.documentId, entry: created };
}

module.exports = {
  seedTermsAndConditions,
  TERMS_AND_CONDITIONS_PAYLOAD,
};
