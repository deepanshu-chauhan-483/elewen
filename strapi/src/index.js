'use strict';

module.exports = {
  register({ strapi }) {
    // Register custom services, controllers, routes here
  },
  async bootstrap({ strapi }) {
    const publicUrl = process.env.PUBLIC_URL || strapi.config.get('server.url') || 'http://localhost:1337';
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN?.split(',')?.[0] ||
      'http://localhost:5173';
    // Keep users-permissions email templates aligned with the verified sender
    // from env so registration does not fail due to the default strapi.io domain.
    const senderEmail =
      process.env.SMTP_FROM ||
      strapi.config.get('plugin::email.settings.defaultFrom') ||
      'onboarding@resend.dev';
    const senderName = process.env.SMTP_FROM_NAME || 'Elewen';
    const replyTo =
      process.env.SMTP_REPLY_TO ||
      strapi.config.get('plugin::email.settings.defaultReplyTo') ||
      senderEmail;

    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const currentAdvancedSettings = await pluginStore.get({ key: 'advanced' });
    const currentGrant = await pluginStore.get({ key: 'grant' });
    const currentTemplates = await pluginStore.get({ key: 'email' });

    if (currentTemplates && typeof currentTemplates === 'object') {
      const nextTemplates = { ...currentTemplates };
      let emailTemplatesChanged = false;

      const confirmationEmailBody =
        '<p>Thank you for registering!</p>' +
        '<p>You have to confirm your email address. Please click on the link below.</p>' +
        '<p><a href="<%= URL %>?confirmation=<%= CODE %>">Confirm my email</a></p>' +
        '<p>Or copy this link: <%= URL %>?confirmation=<%= CODE %></p>' +
        '<p>Thanks.</p>';

      const resetPasswordEmailBody =
        '<p>We heard that you lost your password. Sorry about that!</p>' +
        '<p>But don’t worry! You can use the following link to reset your password:</p>' +
        '<p><a href="<%= URL %>?code=<%= TOKEN %>">Reset your password</a></p>' +
        '<p><%= URL %>?code=<%= TOKEN %></p>' +
        '<p>Thanks.</p>';

      ['email_confirmation', 'reset_password'].forEach(templateKey => {
        const template = nextTemplates[templateKey];
        if (!template || !template.options) return;

        const currentFrom = template.options.from || {};
        const currentReplyTo = template.options.response_email || '';
        const currentMessage = template.options.message || '';
        const currentObject = template.options.object || '';

        const nextOptions = {
          ...template.options,
          from: {
            ...currentFrom,
            name: senderName,
            email: senderEmail,
          },
          response_email: replyTo,
        };

        if (templateKey === 'email_confirmation') {
          nextOptions.object = 'Confirm your Elewen account';
          nextOptions.message = confirmationEmailBody;
        }

        if (templateKey === 'reset_password') {
          nextOptions.object = 'Reset your Elewen password';
          nextOptions.message = resetPasswordEmailBody;
        }

        const unchanged =
          currentFrom.email === senderEmail &&
          currentFrom.name === senderName &&
          currentReplyTo === replyTo &&
          currentMessage === nextOptions.message &&
          currentObject === nextOptions.object;

        if (unchanged) return;

        nextTemplates[templateKey] = { ...template, options: nextOptions };
        emailTemplatesChanged = true;
      });

      if (emailTemplatesChanged) {
        await pluginStore.set({ key: 'email', value: nextTemplates });
        strapi.log.info(
          `[users-permissions] Email template sender synced to verified address: ${senderEmail}`
        );
      }
    } else {
      strapi.log.warn(
        '[users-permissions] Email templates not found in plugin store; skipping sender sync.'
      );
    }

    if (currentAdvancedSettings && typeof currentAdvancedSettings === 'object') {
      const oauthRedirect = `${frontendUrl.replace(/\/$/, '')}/auth/callback`;
      // Default ON — set STRAPI_EMAIL_CONFIRMATION=false only to skip verification emails (local debug).
      const emailConfirmation = process.env.STRAPI_EMAIL_CONFIRMATION !== 'false';
      const confirmRedirectBase = `${frontendUrl.replace(/\/$/, '')}/login`;
      const nextAdvancedSettings = {
        ...currentAdvancedSettings,
        allow_register: true,
        unique_email: true,
        email_confirmation: emailConfirmation,
        email_reset_password: `${frontendUrl}/reset-password`,
        email_confirmation_redirection: `${confirmRedirectBase}?confirmed=true`,
        default_redirect_url: oauthRedirect,
      };

      await pluginStore.set({ key: 'advanced', value: nextAdvancedSettings });
      strapi.log.info(
        `[users-permissions] email_confirmation=${emailConfirmation}, reset-password URL: ${nextAdvancedSettings.email_reset_password}, post-login redirect: ${oauthRedirect}`
      );
    }

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      // Must match Google Cloud Console + Strapi users-permissions grant URL:
      // {PUBLIC_URL}/api/connect/google/callback
      const googleCallbackUrl =
        process.env.GOOGLE_REDIRECT_URI || `${publicUrl}/api/connect/google/callback`;
      const baseGrant =
        currentGrant && typeof currentGrant === 'object' ? { ...currentGrant } : {};
      const previousGoogle = baseGrant.google && typeof baseGrant.google === 'object' ? baseGrant.google : {};

      const nextGrant = {
        ...baseGrant,
        google: {
          enabled: true,
          icon: 'google',
          ...previousGoogle,
          key: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: googleCallbackUrl,
          callback: googleCallbackUrl,
          scope:
            Array.isArray(previousGoogle.scope) && previousGoogle.scope.length
              ? previousGoogle.scope
              : ['email', 'profile'],
        },
      };

      await pluginStore.set({ key: 'grant', value: nextGrant });
      strapi.log.info(
        `[users-permissions] Google OAuth enabled. Start: ${publicUrl}/api/connect/google → callback: ${nextGrant.google.callbackUrl} → frontend: ${frontendUrl.replace(/\/$/, '')}/auth/callback`
      );
    } else {
      strapi.log.warn(
        '[users-permissions] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing — Continue with Google will not work.'
      );
    }

    if (process.env.SEED_CATERING_ESSENTIALS !== 'false') {
      try {
        const { seedCateringEssentials } = require('./seed/catering-essentials');
        const essentialsResult = await seedCateringEssentials(strapi);
        const essentialsCreated = essentialsResult.packages.filter(
          item => !item.skipped && !item.repaired
        ).length;
        const essentialsRepaired = essentialsResult.packages.filter(item => item.repaired).length;
        const essentialsSkipped = essentialsResult.packages.filter(item => item.skipped).length;

        strapi.log.info(
          `[seed/catering] Essentials created=${essentialsCreated}, repaired=${essentialsRepaired}, skipped=${essentialsSkipped}`
        );

        const { seedCateringAssisted } = require('./seed/catering-assisted');
        const assistedResult = await seedCateringAssisted(strapi);
        const assistedCreated = assistedResult.packages.filter(
          item => !item.skipped && !item.repaired
        ).length;
        const assistedRepaired = assistedResult.packages.filter(item => item.repaired).length;
        const assistedSkipped = assistedResult.packages.filter(item => item.skipped).length;

        strapi.log.info(
          `[seed/catering] Assisted created=${assistedCreated}, repaired=${assistedRepaired}, skipped=${assistedSkipped}, policy=${assistedResult.policyDocumentId}`
        );

        const { seedCateringEndToEnd } = require('./seed/catering-end-to-end');
        const endToEndResult = await seedCateringEndToEnd(strapi);
        const endToEndCreated = endToEndResult.packages.filter(
          item => !item.skipped && !item.repaired
        ).length;
        const endToEndRepaired = endToEndResult.packages.filter(item => item.repaired).length;
        const endToEndSkipped = endToEndResult.packages.filter(item => item.skipped).length;

        strapi.log.info(
          `[seed/catering] End-to-end created=${endToEndCreated}, repaired=${endToEndRepaired}, skipped=${endToEndSkipped}`
        );

        const { seedCateringAddons } = require('./seed/catering-addons');
        const addonsResult = await seedCateringAddons(strapi);
        const addonsCreated = addonsResult.addons.filter(item => !item.skipped).length;
        const addonsSkipped = addonsResult.addons.filter(item => item.skipped).length;
        const addonsUpdated = addonsResult.addons.filter(item => item.updated).length;

        strapi.log.info(
          `[seed/catering-addons] created=${addonsCreated}, updated=${addonsUpdated}, skipped=${addonsSkipped}`
        );

        const { seedCateringDiscountSettings } = require('./seed/catering-discount-settings');
        const discountResult = await seedCateringDiscountSettings(strapi);
        strapi.log.info(
          `[seed/catering-discounts] documentId=${discountResult.documentId}, created=${Boolean(discountResult.created)}, updated=${Boolean(discountResult.updated)}`
        );

        if (process.env.SEED_CATERING_MENU !== 'false') {
          const { seedCateringMenuLibrary } = require('./seed/catering-menu-library');
          const menuResult = await seedCateringMenuLibrary(strapi);
          strapi.log.info(
            `[seed/catering-menu] documentId=${menuResult.documentId}, created=${Boolean(menuResult.created)}, updated=${Boolean(menuResult.updated)}`
          );
        }
      } catch (error) {
        strapi.log.error('[seed/catering] Catering seed failed:', error);
      }
    }
  },
};
