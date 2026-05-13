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

      ['email_confirmation', 'reset_password'].forEach(templateKey => {
        const template = nextTemplates[templateKey];
        if (!template || !template.options) return;

        const currentFrom = template.options.from || {};
        const currentReplyTo = template.options.response_email || '';

        if (
          currentFrom.email === senderEmail &&
          currentFrom.name === senderName &&
          currentReplyTo === replyTo
        ) {
          return;
        }

        nextTemplates[templateKey] = {
          ...template,
          options: {
            ...template.options,
            from: {
              ...currentFrom,
              name: senderName,
              email: senderEmail,
            },
            response_email: replyTo,
          },
        };
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
      const nextAdvancedSettings = {
        ...currentAdvancedSettings,
        email_reset_password: `${frontendUrl}/reset-password`,
        email_confirmation_redirection: `${frontendUrl}/login?confirmed=true`,
      };

      if (
        nextAdvancedSettings.email_reset_password !== currentAdvancedSettings.email_reset_password ||
        nextAdvancedSettings.email_confirmation_redirection !==
          currentAdvancedSettings.email_confirmation_redirection
      ) {
        await pluginStore.set({ key: 'advanced', value: nextAdvancedSettings });
        strapi.log.info(
          `[users-permissions] Auth redirect URLs synced to frontend: ${frontendUrl}`
        );
      }
    }

    if (
      currentGrant &&
      typeof currentGrant === 'object' &&
      currentGrant.google &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    ) {
      const nextGrant = {
        ...currentGrant,
        google: {
          ...currentGrant.google,
          enabled: true,
          key: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: `${publicUrl}/api/auth/google/callback`,
          scope: Array.isArray(currentGrant.google.scope) && currentGrant.google.scope.length
            ? currentGrant.google.scope
            : ['email', 'profile'],
        },
      };

      const googleConfigChanged =
        currentGrant.google.enabled !== nextGrant.google.enabled ||
        currentGrant.google.key !== nextGrant.google.key ||
        currentGrant.google.secret !== nextGrant.google.secret ||
        currentGrant.google.callbackUrl !== nextGrant.google.callbackUrl;

      if (googleConfigChanged) {
        await pluginStore.set({ key: 'grant', value: nextGrant });
        strapi.log.info(
          `[users-permissions] Google provider synced for callback URL: ${nextGrant.google.callbackUrl}`
        );
      }
    }
  },
};
