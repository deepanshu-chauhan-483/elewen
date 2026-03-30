'use strict';

module.exports = {
  register({ strapi }) {
    // Register custom services, controllers, routes here
  },
  async bootstrap({ strapi }) {
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
    const currentTemplates = await pluginStore.get({ key: 'email' });

    if (!currentTemplates || typeof currentTemplates !== 'object') {
      strapi.log.warn(
        '[users-permissions] Email templates not found in plugin store; skipping sender sync.'
      );
      return;
    }

    const nextTemplates = { ...currentTemplates };
    let changed = false;

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
      changed = true;
    });

    if (!changed) return;

    await pluginStore.set({ key: 'email', value: nextTemplates });
    strapi.log.info(
      `[users-permissions] Email template sender synced to verified address: ${senderEmail}`
    );
  },
};
