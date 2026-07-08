import type { Schema, Struct } from '@strapi/strapi'

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens'
  info: {
    description: ''
    displayName: 'Api Token'
    name: 'Api Token'
    pluralName: 'api-tokens'
    singularName: 'api-token'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    adminPermissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<''>
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    expiresAt: Schema.Attribute.DateTime
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'>
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions'
  info: {
    description: ''
    displayName: 'API Token Permission'
    name: 'API Token Permission'
    pluralName: 'api-token-permissions'
    singularName: 'api-token-permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions'
  info: {
    description: ''
    displayName: 'Permission'
    name: 'Permission'
    pluralName: 'permissions'
    singularName: 'permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles'
  info: {
    description: ''
    displayName: 'Role'
    name: 'Role'
    pluralName: 'roles'
    singularName: 'role'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> & Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>
  }
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions'
  info: {
    description: 'Session Manager storage'
    displayName: 'Session'
    name: 'Session'
    pluralName: 'sessions'
    singularName: 'session'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
    i18n: {
      localized: false
    }
  }
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private
    childId: Schema.Attribute.String & Schema.Attribute.Private
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    deviceId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private
    origin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique
    status: Schema.Attribute.String & Schema.Attribute.Private
    type: Schema.Attribute.String & Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    userId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
  }
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens'
  info: {
    description: ''
    displayName: 'Transfer Token'
    name: 'Transfer Token'
    pluralName: 'transfer-tokens'
    singularName: 'transfer-token'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<''>
    expiresAt: Schema.Attribute.DateTime
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminTransferTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions'
  info: {
    description: ''
    displayName: 'Transfer Token Permission'
    name: 'Transfer Token Permission'
    pluralName: 'transfer-token-permissions'
    singularName: 'transfer-token-permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users'
  info: {
    description: ''
    displayName: 'User'
    name: 'User'
    pluralName: 'users'
    singularName: 'user'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> & Schema.Attribute.Private
    blocked: Schema.Attribute.Boolean & Schema.Attribute.Private & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> & Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    preferedLanguage: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> & Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    username: Schema.Attribute.String
  }
}

export interface ApiAboutPageAboutPage extends Struct.SingleTypeSchema {
  collectionName: 'about_page'
  info: {
    displayName: 'About Page'
    pluralName: 'about-pages'
    singularName: 'about-page'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about-page.about-page'> &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiAddonAddon extends Struct.CollectionTypeSchema {
  collectionName: 'addons'
  info: {
    displayName: 'Addon'
    pluralName: 'addons'
    singularName: 'addon'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    addon_scope: Schema.Attribute.Enumeration<
      ['universal', 'catering', 'decor', 'bartending', 'sheesha']
    > &
      Schema.Attribute.DefaultTo<'universal'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::addon.addon'> &
      Schema.Attribute.Private
    max_price: Schema.Attribute.Decimal
    max_quantity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>
    name: Schema.Attribute.String & Schema.Attribute.Required
    packages: Schema.Attribute.Relation<'manyToMany', 'api::package.package'>
    price: Schema.Attribute.Decimal & Schema.Attribute.Required
    pricing_rules: Schema.Attribute.Component<'package.package-pricing-rule', true>
    publishedAt: Schema.Attribute.DateTime
    unit: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface ApiAddressAddress extends Struct.CollectionTypeSchema {
  collectionName: 'addresses'
  info: {
    displayName: 'Address'
    pluralName: 'addresses'
    singularName: 'address'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required
    country: Schema.Attribute.String & Schema.Attribute.DefaultTo<'India'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    latitude: Schema.Attribute.Decimal
    line1: Schema.Attribute.String & Schema.Attribute.Required
    line2: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::address.address'> &
      Schema.Attribute.Private
    longitude: Schema.Attribute.Decimal
    pincode: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    state: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiAdvancePaymentExplanationAdvancePaymentExplanation
  extends Struct.SingleTypeSchema {
  collectionName: 'advance_payment_explanation'
  info: {
    displayName: 'Advance Payment Explanation'
    pluralName: 'advance-payment-explanations'
    singularName: 'advance-payment-explanation'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::advance-payment-explanation.advance-payment-explanation'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBlogBlog extends Struct.CollectionTypeSchema {
  collectionName: 'blogs'
  info: {
    displayName: 'Blog'
    pluralName: 'blogs'
    singularName: 'blog'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    author: Schema.Attribute.String
    blog_images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    category: Schema.Attribute.String
    content_blocks: Schema.Attribute.Blocks
    cover_image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    excerpt: Schema.Attribute.Text
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::blog.blog'> &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    post_published_at: Schema.Attribute.DateTime
    post_status: Schema.Attribute.Enumeration<['draft', 'published']>
    publishedAt: Schema.Attribute.DateTime
    related_events: Schema.Attribute.Relation<'manyToMany', 'api::event.event'>
    related_services: Schema.Attribute.Relation<'manyToMany', 'api::service.service'>
    slug: Schema.Attribute.UID<'title'>
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface ApiBookingCancellationMessagingBookingCancellationMessaging
  extends Struct.SingleTypeSchema {
  collectionName: 'booking_cancellation_messaging'
  info: {
    displayName: 'Booking Cancellation Messaging'
    pluralName: 'booking-cancellation-messagings'
    singularName: 'booking-cancellation-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::booking-cancellation-messaging.booking-cancellation-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBookingConfirmationMessagingBookingConfirmationMessaging
  extends Struct.SingleTypeSchema {
  collectionName: 'booking_confirmation_messaging'
  info: {
    displayName: 'Booking Confirmation Messaging'
    pluralName: 'booking-confirmation-messagings'
    singularName: 'booking-confirmation-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::booking-confirmation-messaging.booking-confirmation-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBookingReviewBookingReview extends Struct.CollectionTypeSchema {
  collectionName: 'booking_reviews'
  info: {
    displayName: 'Booking Review'
    pluralName: 'booking-reviews'
    singularName: 'booking-review'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    is_visible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::booking-review.booking-review'> &
      Schema.Attribute.Private
    package: Schema.Attribute.Relation<'manyToOne', 'api::package.package'>
    publishedAt: Schema.Attribute.DateTime
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5
          min: 1
        },
        number
      >
    review_text: Schema.Attribute.Text
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiBudgetLevelBudgetLevel extends Struct.CollectionTypeSchema {
  collectionName: 'budget_levels'
  info: {
    displayName: 'Budget Level'
    pluralName: 'budget-levels'
    singularName: 'budget-level'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    display_order: Schema.Attribute.Integer
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::budget-level.budget-level'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCancellationPolicyCancellationPolicy extends Struct.SingleTypeSchema {
  collectionName: 'cancellation_policies'
  info: {
    displayName: 'CancellationPolicy'
    pluralName: 'cancellation-policies'
    singularName: 'cancellation-policy'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    after_48h: Schema.Attribute.String
    between_16_48h: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cancellation-policy.cancellation-policy'
    > &
      Schema.Attribute.Private
    material_policy: Schema.Attribute.Text
    publishedAt: Schema.Attribute.DateTime
    refund_note: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    within_16h: Schema.Attribute.String
  }
}

export interface ApiCartMessagingCartMessaging extends Struct.SingleTypeSchema {
  collectionName: 'cart_messaging'
  info: {
    displayName: 'Cart Page Messaging'
    pluralName: 'cart-messagings'
    singularName: 'cart-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::cart-messaging.cart-messaging'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCateringMenuCateringMenu extends Struct.SingleTypeSchema {
  collectionName: 'catering_menus'
  info: {
    description: 'Global catering menu dishes by category (shared across packages)'
    displayName: 'Catering Menu Library'
    pluralName: 'catering-menus'
    singularName: 'catering-menu'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    categories: Schema.Attribute.Component<'package.catering-menu-category', true>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::catering-menu.catering-menu'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Catering menu library'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCateringSettingCateringSetting extends Struct.SingleTypeSchema {
  collectionName: 'catering_settings'
  info: {
    description: 'Global catering configuration (guest-count discounts, etc.)'
    displayName: 'Catering Settings'
    pluralName: 'catering-settings'
    singularName: 'catering-setting'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    discount_note: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Per-person discount applied to catering package price based on selected guest count.'>
    discount_title: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Guest count discounts'>
    guest_discount_tiers: Schema.Attribute.Component<'package.catering-guest-discount-tier', true>
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::catering-setting.catering-setting'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCelebrationEveryDayCelebrationEveryDay extends Struct.CollectionTypeSchema {
  collectionName: 'celebration_every_days'
  info: {
    displayName: 'celebration_every_day'
    pluralName: 'celebration-every-days'
    singularName: 'celebration-every-day'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    categories: Schema.Attribute.Component<'package.categories', true>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    heading: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::celebration-every-day.celebration-every-day'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    subheading: Schema.Attribute.Text
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCheckoutMessagingCheckoutMessaging extends Struct.SingleTypeSchema {
  collectionName: 'checkout_messaging'
  info: {
    displayName: 'Checkout Page Messaging'
    pluralName: 'checkout-messagings'
    singularName: 'checkout-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::checkout-messaging.checkout-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiConsultationPageConsultationPage extends Struct.SingleTypeSchema {
  collectionName: 'consultation_page'
  info: {
    displayName: 'Book a Consultation Page'
    pluralName: 'consultation-pages'
    singularName: 'consultation-page'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::consultation-page.consultation-page'
    > &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCouponMessagingCouponMessaging extends Struct.SingleTypeSchema {
  collectionName: 'coupon_messaging'
  info: {
    displayName: 'Coupon & Discount Messaging'
    pluralName: 'coupon-messagings'
    singularName: 'coupon-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::coupon-messaging.coupon-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCouponCoupon extends Struct.CollectionTypeSchema {
  collectionName: 'coupons'
  info: {
    displayName: 'Coupon'
    pluralName: 'coupons'
    singularName: 'coupon'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    discount_type: Schema.Attribute.Enumeration<['percentage', 'flat']>
    discount_value: Schema.Attribute.Decimal & Schema.Attribute.Required
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::coupon.coupon'> &
      Schema.Attribute.Private
    max_uses: Schema.Attribute.Integer
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    used_count: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    valid_from: Schema.Attribute.Date
    valid_to: Schema.Attribute.Date
  }
}

export interface ApiCustomerProfileCustomerProfile extends Struct.CollectionTypeSchema {
  collectionName: 'customer_profiles'
  info: {
    displayName: 'Customer Profile'
    pluralName: 'customer-profiles'
    singularName: 'customer-profile'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    date_of_birth: Schema.Attribute.Date
    first_name: Schema.Attribute.String
    last_name: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customer-profile.customer-profile'
    > &
      Schema.Attribute.Private
    preferred_language: Schema.Attribute.String & Schema.Attribute.DefaultTo<'en'>
    profile_photo: Schema.Attribute.Media<'images'>
    profile_photo_url: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiDeliveryChargeDeliveryCharge extends Struct.CollectionTypeSchema {
  collectionName: 'delivery_charges'
  info: {
    displayName: 'delivery-charge'
    pluralName: 'delivery-charges'
    singularName: 'delivery-charge'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    addon_1200: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    addon_3200: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    addon_600: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::delivery-charge.delivery-charge'> &
      Schema.Attribute.Private
    location: Schema.Attribute.Text
    pincode: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiEventEvent extends Struct.CollectionTypeSchema {
  collectionName: 'events'
  info: {
    displayName: 'Event'
    pluralName: 'events'
    singularName: 'event'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    blogs: Schema.Attribute.Relation<'manyToMany', 'api::blog.blog'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Blocks
    display_order: Schema.Attribute.Integer
    events: Schema.Attribute.Relation<'oneToMany', 'api::event.event'>
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::event.event'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    packages: Schema.Attribute.Relation<'manyToMany', 'api::package.package'>
    parent_event: Schema.Attribute.Relation<'manyToOne', 'api::event.event'>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required
    tagline: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiFaqItemFaqItem extends Struct.CollectionTypeSchema {
  collectionName: 'faq_items'
  info: {
    displayName: 'Faq Item'
    pluralName: 'faq-items'
    singularName: 'faq-item'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required
    category: Schema.Attribute.Enumeration<
      ['general', 'booking', 'payment', 'planner', 'consultation']
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    display_order: Schema.Attribute.Integer
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq-item.faq-item'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    question: Schema.Attribute.Text & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiFooterContentFooterContent extends Struct.SingleTypeSchema {
  collectionName: 'footer_content'
  info: {
    displayName: 'Footer Content'
    pluralName: 'footer-contents'
    singularName: 'footer-content'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::footer-content.footer-content'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiGlobalCtasGlobalCtas extends Struct.SingleTypeSchema {
  collectionName: 'global_ctas'
  info: {
    displayName: 'Global CTAs & Copy'
    pluralName: 'global-ctas-list'
    singularName: 'global-ctas'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::global-ctas.global-ctas'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiGlobalSettingGlobalSetting extends Struct.SingleTypeSchema {
  collectionName: 'global_settings'
  info: {
    displayName: 'Global Setting'
    pluralName: 'global-settings'
    singularName: 'global-setting'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    advance_payment_percentage: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<30>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::global-setting.global-setting'> &
      Schema.Attribute.Private
    primary_phone: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    response_expectation_text: Schema.Attribute.Text
    support_availability_text: Schema.Attribute.Text
    support_email: Schema.Attribute.Email
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    whatsapp_number: Schema.Attribute.String
  }
}

export interface ApiGrandCelebrationsIntroGrandCelebrationsIntro
  extends Struct.CollectionTypeSchema {
  collectionName: 'grand_celebrations_intros'
  info: {
    displayName: 'grand_celebrations_intro'
    pluralName: 'grand-celebrations-intros'
    singularName: 'grand-celebrations-intro'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    category_item: Schema.Attribute.Component<'package.category-item', true>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    heading_1: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::grand-celebrations-intro.grand-celebrations-intro'
    > &
      Schema.Attribute.Private
    note: Schema.Attribute.Text
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiHowItWorksStepLandingPageHowItWorksStepLandingPage
  extends Struct.CollectionTypeSchema {
  collectionName: 'how_it_works_step_landing_pages'
  info: {
    displayName: 'How_It_Works_Step_Landing_page'
    pluralName: 'how-it-works-step-landing-pages'
    singularName: 'how-it-works-step-landing-page'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    Bottom_Content: Schema.Attribute.Text
    bottom_heading: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::how-it-works-step-landing-page.how-it-works-step-landing-page'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    Sections: Schema.Attribute.Component<'shared.sections', true>
    Title: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiHowItWorksHowItWorks extends Struct.SingleTypeSchema {
  collectionName: 'how_it_works'
  info: {
    displayName: 'How It Works'
    pluralName: 'how-it-works-pages'
    singularName: 'how-it-works'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::how-it-works.how-it-works'> &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiInhousePlannerPageInhousePlannerPage extends Struct.SingleTypeSchema {
  collectionName: 'inhouse_planner_page'
  info: {
    displayName: 'In-House Planner Page'
    pluralName: 'inhouse-planner-pages'
    singularName: 'inhouse-planner-page'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::inhouse-planner-page.inhouse-planner-page'
    > &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiLandingPageLandingPage extends Struct.SingleTypeSchema {
  collectionName: 'landing_page'
  info: {
    displayName: 'Landing Page'
    pluralName: 'landing-pages'
    singularName: 'landing-page'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::landing-page.landing-page'> &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiNavigationMenuNavigationMenu extends Struct.CollectionTypeSchema {
  collectionName: 'navigation_menus'
  info: {
    displayName: 'Navigation Menu'
    pluralName: 'navigation-menus'
    singularName: 'navigation-menu'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    items: Schema.Attribute.Component<'cms.navigation-item', true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::navigation-menu.navigation-menu'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'title'>
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiPackagePackage extends Struct.CollectionTypeSchema {
  collectionName: 'packages'
  info: {
    displayName: 'Package'
    pluralName: 'packages'
    singularName: 'package'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    base_price: Schema.Attribute.Decimal & Schema.Attribute.Required
    booking_reviews: Schema.Attribute.Relation<'oneToMany', 'api::booking-review.booking-review'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Blocks
    events: Schema.Attribute.Relation<'manyToMany', 'api::event.event'>
    images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    internal_notes: Schema.Attribute.Text
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::package.package'> &
      Schema.Attribute.Private
    meta_description: Schema.Attribute.Text
    meta_title: Schema.Attribute.String
    most_booked_tag: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    packages: Schema.Attribute.DynamicZone<
      [
        'package.decorpackages',
        'package.sheeshapackage',
        'package.bartendingpackage',
        'package.cateringpackage',
      ]
    >
    publishedAt: Schema.Attribute.DateTime
    reusable_addons: Schema.Attribute.Relation<'manyToMany', 'api::addon.addon'>
    saved_packages: Schema.Attribute.Relation<'oneToMany', 'api::saved-package.saved-package'>
    service_categories: Schema.Attribute.Relation<
      'manyToMany',
      'api::service-category.service-category'
    >
    slug: Schema.Attribute.UID<'title'>
    title: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface ApiPaymentCancelledMessagingPaymentCancelledMessaging
  extends Struct.SingleTypeSchema {
  collectionName: 'payment_cancelled_messaging'
  info: {
    displayName: 'Payment Cancelled Messaging'
    pluralName: 'payment-cancelled-messagings'
    singularName: 'payment-cancelled-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-cancelled-messaging.payment-cancelled-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiPaymentFailedMessagingPaymentFailedMessaging extends Struct.SingleTypeSchema {
  collectionName: 'payment_failed_messaging'
  info: {
    displayName: 'Payment Failed Messaging'
    pluralName: 'payment-failed-messagings'
    singularName: 'payment-failed-messaging'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-failed-messaging.payment-failed-messaging'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiPlannerLeadPlannerLead extends Struct.CollectionTypeSchema {
  collectionName: 'planner_leads'
  info: {
    displayName: 'Planner Lead'
    pluralName: 'planner-leads'
    singularName: 'planner-lead'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    budget_range: Schema.Attribute.String
    city: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    custom_fields: Schema.Attribute.JSON
    email: Schema.Attribute.Email
    event_date: Schema.Attribute.Date
    event_type: Schema.Attribute.String
    full_name: Schema.Attribute.String & Schema.Attribute.Required
    guest_count: Schema.Attribute.Integer
    lead_type: Schema.Attribute.Enumeration<['planner', 'consultation', 'contact us']>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::planner-lead.planner-lead'> &
      Schema.Attribute.Private
    phone: Schema.Attribute.String
    planner_lead_status: Schema.Attribute.Enumeration<['new', 'contacted', 'converted', 'closed']> &
      Schema.Attribute.DefaultTo<'new'>
    publishedAt: Schema.Attribute.DateTime
    support_types: Schema.Attribute.JSON
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    venue_type: Schema.Attribute.String
    vision_notes: Schema.Attribute.Text
  }
}

export interface ApiPlannerPortfolioItemPlannerPortfolioItem extends Struct.CollectionTypeSchema {
  collectionName: 'planner_portfolio_items'
  info: {
    displayName: 'Planner Portfolio Item'
    pluralName: 'planner-portfolio-items'
    singularName: 'planner-portfolio-item'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'entertainment_media',
        'corporate_networking',
        'launches_brand',
        'literary_cultural',
        'social',
      ]
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Blocks
    display_order: Schema.Attribute.Integer
    images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::planner-portfolio-item.planner-portfolio-item'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    serial_number: Schema.Attribute.Integer
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiPolicyPolicy extends Struct.CollectionTypeSchema {
  collectionName: 'policies'
  info: {
    displayName: 'Policy'
    pluralName: 'policies'
    singularName: 'policy'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    content: Schema.Attribute.RichText
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::policy.policy'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    summary_text: Schema.Attribute.Text
    title: Schema.Attribute.String & Schema.Attribute.Required
    type: Schema.Attribute.Enumeration<
      ['cancellation', 'refund', 'pricing_disclaimer', 'terms_conditions', 'material', 'catering']
    >
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>
  }
}

export interface ApiRemainingBalanceExplanationRemainingBalanceExplanation
  extends Struct.SingleTypeSchema {
  collectionName: 'remaining_balance_explanation'
  info: {
    displayName: 'Remaining Balance Explanation'
    pluralName: 'remaining-balance-explanations'
    singularName: 'remaining-balance-explanation'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::remaining-balance-explanation.remaining-balance-explanation'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'cms.content-section', true>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiSavedPackageSavedPackage extends Struct.CollectionTypeSchema {
  collectionName: 'saved_packages'
  info: {
    displayName: 'Saved Package'
    pluralName: 'saved-packages'
    singularName: 'saved-package'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    custom_config: Schema.Attribute.JSON
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::saved-package.saved-package'> &
      Schema.Attribute.Private
    package: Schema.Attribute.Relation<'manyToOne', 'api::package.package'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiServiceAreaServiceArea extends Struct.CollectionTypeSchema {
  collectionName: 'service_areas'
  info: {
    displayName: 'service-area'
    pluralName: 'service-areas'
    singularName: 'service-area'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    extra_pincodes: Schema.Attribute.JSON
    is_active: Schema.Attribute.Boolean
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service-area.service-area'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String
    pincode_end: Schema.Attribute.Integer
    pincode_start: Schema.Attribute.Integer
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiServiceCategoryServiceCategory extends Struct.CollectionTypeSchema {
  collectionName: 'service_categories'
  info: {
    displayName: 'Service Category'
    pluralName: 'service-categories'
    singularName: 'service-category'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-category.service-category'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    packages: Schema.Attribute.Relation<'manyToMany', 'api::package.package'>
    parent_category: Schema.Attribute.Relation<
      'manyToOne',
      'api::service-category.service-category'
    >
    publishedAt: Schema.Attribute.DateTime
    service_categories: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-category.service-category'
    >
    services: Schema.Attribute.Relation<'oneToMany', 'api::service.service'>
    slug: Schema.Attribute.UID<'name'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    wizard_steps: Schema.Attribute.JSON
  }
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
  collectionName: 'services'
  info: {
    displayName: 'Service'
    pluralName: 'services'
    singularName: 'service'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    blogs: Schema.Attribute.Relation<'manyToMany', 'api::blog.blog'>
    category: Schema.Attribute.Relation<'manyToOne', 'api::service-category.service-category'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service.service'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor_services: Schema.Attribute.Relation<'oneToMany', 'api::vendor-service.vendor-service'>
  }
}

export interface ApiTermsAndConditionsTermsAndConditions extends Struct.SingleTypeSchema {
  collectionName: 'terms_and_condition'
  info: {
    displayName: 'TermsAndConditions'
    pluralName: 'terms-and-condition'
    singularName: 'terms-and-conditions'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    contactEmail: Schema.Attribute.Email
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    effectiveDate: Schema.Attribute.Date
    governingLaw: Schema.Attribute.Text
    jurisdiction: Schema.Attribute.Text
    lastUpdated: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::terms-and-conditions.terms-and-conditions'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sections: Schema.Attribute.Component<'terms.section', true>
    title: Schema.Attribute.String
    tldr: Schema.Attribute.Component<'terms.tldr-block', false>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    version: Schema.Attribute.String
  }
}

export interface ApiTestimonialTestimonial extends Struct.CollectionTypeSchema {
  collectionName: 'testimonials'
  info: {
    displayName: 'Testimonial'
    pluralName: 'testimonials'
    singularName: 'testimonial'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    author_image: Schema.Attribute.Media<'images'>
    author_name: Schema.Attribute.String & Schema.Attribute.Required
    body: Schema.Attribute.Text & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    event_category: Schema.Attribute.String
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::testimonial.testimonial'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    star_rating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5
          min: 1
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface ApiThemeTheme extends Struct.CollectionTypeSchema {
  collectionName: 'themes'
  info: {
    displayName: 'Theme'
    pluralName: 'themes'
    singularName: 'theme'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    display_order: Schema.Attribute.Integer
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::theme.theme'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    preview_image: Schema.Attribute.Media<'images'>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiVendorDocumentVendorDocument extends Struct.CollectionTypeSchema {
  collectionName: 'vendor_documents'
  info: {
    displayName: 'Vendor Document'
    pluralName: 'vendor-documents'
    singularName: 'vendor-document'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    document_type: Schema.Attribute.Enumeration<['license', 'insurance', 'portfolio', 'id']>
    file: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::vendor-document.vendor-document'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
    verified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
  }
}

export interface ApiVendorPortfolioVendorPortfolio extends Struct.CollectionTypeSchema {
  collectionName: 'vendor_portfolios'
  info: {
    displayName: 'Vendor Portfolio'
    pluralName: 'vendor-portfolios'
    singularName: 'vendor-portfolio'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vendor-portfolio.vendor-portfolio'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiVendorServiceVendorService extends Struct.CollectionTypeSchema {
  collectionName: 'vendor_services'
  info: {
    displayName: 'Vendor Service'
    pluralName: 'vendor-services'
    singularName: 'vendor-service'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::vendor-service.vendor-service'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    service: Schema.Attribute.Relation<'manyToOne', 'api::service.service'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiVendorVendor extends Struct.CollectionTypeSchema {
  collectionName: 'vendors'
  info: {
    displayName: 'Vendor'
    pluralName: 'vendors'
    singularName: 'vendor'
  }
  options: {
    draftAndPublish: true
  }
  attributes: {
    company_name: Schema.Attribute.String & Schema.Attribute.Required
    contact_person: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    email: Schema.Attribute.Email & Schema.Attribute.Required
    experience_years: Schema.Attribute.Integer
    is_available: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    lead_time_days: Schema.Attribute.Integer
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::vendor.vendor'> &
      Schema.Attribute.Private
    location_city: Schema.Attribute.String
    minimum_price: Schema.Attribute.Decimal
    phone: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    registration_data: Schema.Attribute.JSON
    service_area: Schema.Attribute.String
    team_size: Schema.Attribute.Integer
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>
    vendor_documents: Schema.Attribute.Relation<'oneToMany', 'api::vendor-document.vendor-document'>
    vendor_portfolios: Schema.Attribute.Relation<
      'oneToMany',
      'api::vendor-portfolio.vendor-portfolio'
    >
    vendor_services: Schema.Attribute.Relation<'oneToMany', 'api::vendor-service.vendor-service'>
    vendor_status: Schema.Attribute.Enumeration<['pending', 'approved', 'rejected', 'inactive']>
  }
}

export interface PluginContentReleasesRelease extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases'
  info: {
    displayName: 'Release'
    pluralName: 'releases'
    singularName: 'release'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    actions: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release-action'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    releasedAt: Schema.Attribute.DateTime
    scheduledAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Schema.Attribute.Required
    timezone: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginContentReleasesReleaseAction extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions'
  info: {
    displayName: 'Release Action'
    pluralName: 'release-actions'
    singularName: 'release-action'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    entryDocumentId: Schema.Attribute.String
    isEntryValid: Schema.Attribute.Boolean
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    release: Schema.Attribute.Relation<'manyToOne', 'plugin::content-releases.release'>
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale'
  info: {
    collectionName: 'locales'
    description: ''
    displayName: 'Locale'
    pluralName: 'locales'
    singularName: 'locale'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::i18n.locale'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50
          min: 1
        },
        number
      >
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflow extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows'
  info: {
    description: ''
    displayName: 'Workflow'
    name: 'Workflow'
    pluralName: 'workflows'
    singularName: 'workflow'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >
    stages: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow-stage'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflowStage extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages'
  info: {
    description: ''
    displayName: 'Stages'
    name: 'Workflow Stage'
    pluralName: 'workflow-stages'
    singularName: 'workflow-stage'
  }
  options: {
    draftAndPublish: false
    version: '1.1.0'
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    workflow: Schema.Attribute.Relation<'manyToOne', 'plugin::review-workflows.workflow'>
  }
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files'
  info: {
    description: ''
    displayName: 'File'
    pluralName: 'files'
    singularName: 'file'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    alternativeText: Schema.Attribute.Text
    caption: Schema.Attribute.Text
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    ext: Schema.Attribute.String
    focalPoint: Schema.Attribute.JSON
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    formats: Schema.Attribute.JSON
    hash: Schema.Attribute.String & Schema.Attribute.Required
    height: Schema.Attribute.Integer
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'> &
      Schema.Attribute.Private
    mime: Schema.Attribute.String & Schema.Attribute.Required
    name: Schema.Attribute.String & Schema.Attribute.Required
    previewUrl: Schema.Attribute.Text
    provider: Schema.Attribute.String & Schema.Attribute.Required
    provider_metadata: Schema.Attribute.JSON
    publishedAt: Schema.Attribute.DateTime
    related: Schema.Attribute.Relation<'morphToMany'>
    size: Schema.Attribute.Decimal & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    url: Schema.Attribute.Text & Schema.Attribute.Required
    width: Schema.Attribute.Integer
  }
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders'
  info: {
    displayName: 'Folder'
    pluralName: 'folders'
    singularName: 'folder'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    pathId: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsPermission extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions'
  info: {
    description: ''
    displayName: 'Permission'
    name: 'permission'
    pluralName: 'permissions'
    singularName: 'permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsRole extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles'
  info: {
    description: ''
    displayName: 'Role'
    name: 'role'
    pluralName: 'roles'
    singularName: 'role'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.role'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'>
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.String & Schema.Attribute.Unique
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>
  }
}

export interface PluginUsersPermissionsUser extends Struct.CollectionTypeSchema {
  collectionName: 'up_users'
  info: {
    description: ''
    displayName: 'User'
    name: 'user'
    pluralName: 'users'
    singularName: 'user'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    addresses: Schema.Attribute.Relation<'oneToMany', 'api::address.address'>
    admin_role: Schema.Attribute.Enumeration<['super_admin', 'operations', 'support', 'finance']> &
      Schema.Attribute.DefaultTo<'operations'>
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    booking_reviews: Schema.Attribute.Relation<'oneToMany', 'api::booking-review.booking-review'>
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    date_of_birth: Schema.Attribute.Date
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    first_name: Schema.Attribute.String
    is_admin: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    last_name: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    phone: Schema.Attribute.String
    preferred_language: Schema.Attribute.String & Schema.Attribute.DefaultTo<'en'>
    profile_photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    provider: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>
    saved_packages: Schema.Attribute.Relation<'oneToMany', 'api::saved-package.saved-package'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
    vendor: Schema.Attribute.Relation<'oneToOne', 'api::vendor.vendor'>
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken
      'admin::api-token-permission': AdminApiTokenPermission
      'admin::permission': AdminPermission
      'admin::role': AdminRole
      'admin::session': AdminSession
      'admin::transfer-token': AdminTransferToken
      'admin::transfer-token-permission': AdminTransferTokenPermission
      'admin::user': AdminUser
      'api::about-page.about-page': ApiAboutPageAboutPage
      'api::addon.addon': ApiAddonAddon
      'api::address.address': ApiAddressAddress
      'api::advance-payment-explanation.advance-payment-explanation': ApiAdvancePaymentExplanationAdvancePaymentExplanation
      'api::blog.blog': ApiBlogBlog
      'api::booking-cancellation-messaging.booking-cancellation-messaging': ApiBookingCancellationMessagingBookingCancellationMessaging
      'api::booking-confirmation-messaging.booking-confirmation-messaging': ApiBookingConfirmationMessagingBookingConfirmationMessaging
      'api::booking-review.booking-review': ApiBookingReviewBookingReview
      'api::budget-level.budget-level': ApiBudgetLevelBudgetLevel
      'api::cancellation-policy.cancellation-policy': ApiCancellationPolicyCancellationPolicy
      'api::cart-messaging.cart-messaging': ApiCartMessagingCartMessaging
      'api::catering-menu.catering-menu': ApiCateringMenuCateringMenu
      'api::catering-setting.catering-setting': ApiCateringSettingCateringSetting
      'api::celebration-every-day.celebration-every-day': ApiCelebrationEveryDayCelebrationEveryDay
      'api::checkout-messaging.checkout-messaging': ApiCheckoutMessagingCheckoutMessaging
      'api::consultation-page.consultation-page': ApiConsultationPageConsultationPage
      'api::coupon-messaging.coupon-messaging': ApiCouponMessagingCouponMessaging
      'api::coupon.coupon': ApiCouponCoupon
      'api::customer-profile.customer-profile': ApiCustomerProfileCustomerProfile
      'api::delivery-charge.delivery-charge': ApiDeliveryChargeDeliveryCharge
      'api::event.event': ApiEventEvent
      'api::faq-item.faq-item': ApiFaqItemFaqItem
      'api::footer-content.footer-content': ApiFooterContentFooterContent
      'api::global-ctas.global-ctas': ApiGlobalCtasGlobalCtas
      'api::global-setting.global-setting': ApiGlobalSettingGlobalSetting
      'api::grand-celebrations-intro.grand-celebrations-intro': ApiGrandCelebrationsIntroGrandCelebrationsIntro
      'api::how-it-works-step-landing-page.how-it-works-step-landing-page': ApiHowItWorksStepLandingPageHowItWorksStepLandingPage
      'api::how-it-works.how-it-works': ApiHowItWorksHowItWorks
      'api::inhouse-planner-page.inhouse-planner-page': ApiInhousePlannerPageInhousePlannerPage
      'api::landing-page.landing-page': ApiLandingPageLandingPage
      'api::navigation-menu.navigation-menu': ApiNavigationMenuNavigationMenu
      'api::package.package': ApiPackagePackage
      'api::payment-cancelled-messaging.payment-cancelled-messaging': ApiPaymentCancelledMessagingPaymentCancelledMessaging
      'api::payment-failed-messaging.payment-failed-messaging': ApiPaymentFailedMessagingPaymentFailedMessaging
      'api::planner-lead.planner-lead': ApiPlannerLeadPlannerLead
      'api::planner-portfolio-item.planner-portfolio-item': ApiPlannerPortfolioItemPlannerPortfolioItem
      'api::policy.policy': ApiPolicyPolicy
      'api::remaining-balance-explanation.remaining-balance-explanation': ApiRemainingBalanceExplanationRemainingBalanceExplanation
      'api::saved-package.saved-package': ApiSavedPackageSavedPackage
      'api::service-area.service-area': ApiServiceAreaServiceArea
      'api::service-category.service-category': ApiServiceCategoryServiceCategory
      'api::service.service': ApiServiceService
      'api::terms-and-conditions.terms-and-conditions': ApiTermsAndConditionsTermsAndConditions
      'api::testimonial.testimonial': ApiTestimonialTestimonial
      'api::theme.theme': ApiThemeTheme
      'api::vendor-document.vendor-document': ApiVendorDocumentVendorDocument
      'api::vendor-portfolio.vendor-portfolio': ApiVendorPortfolioVendorPortfolio
      'api::vendor-service.vendor-service': ApiVendorServiceVendorService
      'api::vendor.vendor': ApiVendorVendor
      'plugin::content-releases.release': PluginContentReleasesRelease
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction
      'plugin::i18n.locale': PluginI18NLocale
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage
      'plugin::upload.file': PluginUploadFile
      'plugin::upload.folder': PluginUploadFolder
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission
      'plugin::users-permissions.role': PluginUsersPermissionsRole
      'plugin::users-permissions.user': PluginUsersPermissionsUser
    }
  }
}
