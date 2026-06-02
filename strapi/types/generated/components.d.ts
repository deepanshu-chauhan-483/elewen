import type { Schema, Struct } from '@strapi/strapi'

export interface CmsContentSection extends Struct.ComponentSchema {
  collectionName: 'components_cms_content_sections'
  info: {
    displayName: 'Content Section'
  }
  attributes: {
    content_json: Schema.Attribute.JSON
    display_order: Schema.Attribute.Integer
    images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    section_key: Schema.Attribute.String
  }
}

export interface CmsNavigationItem extends Struct.ComponentSchema {
  collectionName: 'components_cms_navigation_items'
  info: {
    displayName: 'Navigation Item'
  }
  attributes: {
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    label: Schema.Attribute.String & Schema.Attribute.Required
    order_index: Schema.Attribute.Integer
    url: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface PackageBartendingpackage extends Struct.ComponentSchema {
  collectionName: 'components_package_bartendingpackages'
  info: {
    displayName: 'bartendingpackage'
  }
  attributes: {
    bartender_type: Schema.Attribute.String
    budget_level: Schema.Attribute.Relation<'oneToOne', 'api::budget-level.budget-level'>
    exclusions: Schema.Attribute.Component<'shared.exclusion-item', true>
    hours_range: Schema.Attribute.String
    ideal_for: Schema.Attribute.Text
    inclusions: Schema.Attribute.Component<'package.inclusions', true>
    policy: Schema.Attribute.Relation<'oneToOne', 'api::policy.policy'>
    price_breakdown: Schema.Attribute.Component<'shared.price-breakdown-item', true>
    price_covers: Schema.Attribute.Component<'shared.price-covers-item', true>
    price_per_extra_hour: Schema.Attribute.Integer
    pricing_rules: Schema.Attribute.Component<'package.package-pricing-rule', true>
    setup_needs: Schema.Attribute.Text
  }
}

export interface PackageCategories extends Struct.ComponentSchema {
  collectionName: 'components_package_categories'
  info: {
    displayName: 'categories'
  }
  attributes: {
    description: Schema.Attribute.Text
    images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    label: Schema.Attribute.String
  }
}

export interface PackageCategoryItem extends Struct.ComponentSchema {
  collectionName: 'components_package_category_items'
  info: {
    displayName: 'category_item'
  }
  attributes: {
    description: Schema.Attribute.Text
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    label: Schema.Attribute.String
  }
}

export interface PackageDecorpackages extends Struct.ComponentSchema {
  collectionName: 'components_package_decorpackages'
  info: {
    displayName: 'decorpackages'
  }
  attributes: {
    addons: Schema.Attribute.Component<'package.package-addon', true>
    backdrop_images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    ballon_count: Schema.Attribute.Integer
    best_placed_at: Schema.Attribute.Text
    budget_level: Schema.Attribute.Relation<'oneToOne', 'api::budget-level.budget-level'>
    color_palette: Schema.Attribute.String
    elements: Schema.Attribute.Component<'package.package-element', true>
    inclustions: Schema.Attribute.Component<'package.inclusions', true>
    key_decor_elements: Schema.Attribute.Text
    nitty_gritty: Schema.Attribute.Text
    notes: Schema.Attribute.Text
    policy: Schema.Attribute.Relation<'oneToOne', 'api::policy.policy'>
    price_breakdown: Schema.Attribute.Component<'shared.price-breakdown-item', true>
    price_covers: Schema.Attribute.Component<'shared.price-covers-item', true>
    pricing_rules: Schema.Attribute.Component<'package.package-pricing-rule', true>
    purpose: Schema.Attribute.Text
    setup_needs: Schema.Attribute.Text
    setup_time: Schema.Attribute.String
    theme: Schema.Attribute.Relation<'oneToOne', 'api::theme.theme'>
    theme_name: Schema.Attribute.String
    why_we_love_it: Schema.Attribute.Text
  }
}

export interface PackageFlavors extends Struct.ComponentSchema {
  collectionName: 'components_package_flavors'
  info: {
    displayName: 'flavors'
  }
  attributes: {
    description: Schema.Attribute.Text
    name: Schema.Attribute.String
  }
}

export interface PackageInclusions extends Struct.ComponentSchema {
  collectionName: 'components_package_inclusions'
  info: {
    displayName: 'inclusions'
  }
  attributes: {
    choice_group_key: Schema.Attribute.String
    choice_group_label: Schema.Attribute.String
    group_title: Schema.Attribute.String
    images: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    is_choice_group: Schema.Attribute.Boolean
    text: Schema.Attribute.String
  }
}

export interface PackagePackageAddon extends Struct.ComponentSchema {
  collectionName: 'components_package_package_addons'
  info: {
    displayName: 'Package Addon'
  }
  attributes: {
    description: Schema.Attribute.Text
    max_quantity: Schema.Attribute.Integer
    name: Schema.Attribute.String & Schema.Attribute.Required
    price: Schema.Attribute.Decimal & Schema.Attribute.Required
    pricing_rules: Schema.Attribute.Component<'package.package-pricing-rule', true>
    unit: Schema.Attribute.String
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface PackagePackageElement extends Struct.ComponentSchema {
  collectionName: 'components_package_package_elements'
  info: {
    displayName: 'Package Element'
  }
  attributes: {
    base_price: Schema.Attribute.Decimal
    base_quantity: Schema.Attribute.Integer
    description: Schema.Attribute.Text
    is_included: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    quantity_editable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    service: Schema.Attribute.Relation<'oneToOne', 'api::service.service'>
    title: Schema.Attribute.String
    unit: Schema.Attribute.Enumeration<['pax', 'sqft', 'piece']>
    visibility: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
  }
}

export interface PackagePackagePricingRule extends Struct.ComponentSchema {
  collectionName: 'components_package_package_pricing_rules'
  info: {
    displayName: 'Package Pricing Rule'
  }
  attributes: {
    modifier_type: Schema.Attribute.Enumeration<['percentage', 'flat_amount']>
    modifier_value: Schema.Attribute.Decimal
    rule_type: Schema.Attribute.Enumeration<['guest_count', 'hours', 'area_size', 'seasonal']>
    value: Schema.Attribute.String
  }
}

export interface PackageSheeshapackage extends Struct.ComponentSchema {
  collectionName: 'components_package_sheeshapackages'
  info: {
    displayName: 'sheeshapackage'
  }
  attributes: {
    addons: Schema.Attribute.Component<'package.package-addon', true>
    elements: Schema.Attribute.Component<'package.package-element', true>
    flavor: Schema.Attribute.Component<'package.flavors', true>
    inclusions: Schema.Attribute.Component<'package.inclusions', true>
    policy: Schema.Attribute.Relation<'oneToOne', 'api::policy.policy'>
    price_breakdown: Schema.Attribute.Component<'shared.price-breakdown-item', true>
    price_covers: Schema.Attribute.Component<'shared.price-covers-item', true>
    pricing_rules: Schema.Attribute.Component<'package.package-pricing-rule', true>
    service_duration: Schema.Attribute.String
    setup_needs: Schema.Attribute.Text
    size: Schema.Attribute.Enumeration<['small', 'medium', 'large']>
  }
}

export interface SharedExclusionItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_exclusion_items'
  info: {
    displayName: 'exclusion-item'
  }
  attributes: {
    text: Schema.Attribute.String
  }
}

export interface SharedPriceBreakdownItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_price_breakdown_items'
  info: {
    displayName: 'price-breakdown-item'
  }
  attributes: {
    amount: Schema.Attribute.Integer
    label: Schema.Attribute.String
  }
}

export interface SharedPriceCoversItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_price_covers_items'
  info: {
    displayName: 'price-covers-item'
  }
  attributes: {
    text: Schema.Attribute.String
  }
}

export interface SharedSections extends Struct.ComponentSchema {
  collectionName: 'components_shared_sections'
  info: {
    displayName: 'Sections'
  }
  attributes: {
    Content: Schema.Attribute.Text
    Heading: Schema.Attribute.String
    Icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>
    section_id: Schema.Attribute.Integer
  }
}

export interface TermsClause extends Struct.ComponentSchema {
  collectionName: 'components_terms_clauses'
  info: {
    displayName: 'clause'
  }
  attributes: {
    applicableTo: Schema.Attribute.Enumeration<['all', 'customer', 'vendor']>
    clauseNumber: Schema.Attribute.String
    content: Schema.Attribute.Text
    isHighlighted: Schema.Attribute.Boolean
    title: Schema.Attribute.String
  }
}

export interface TermsSection extends Struct.ComponentSchema {
  collectionName: 'components_terms_sections'
  info: {
    displayName: 'section'
  }
  attributes: {
    clauses: Schema.Attribute.Component<'terms.clause', true>
    sectionNumber: Schema.Attribute.Integer
    title: Schema.Attribute.String
  }
}

export interface TermsTldrBlock extends Struct.ComponentSchema {
  collectionName: 'components_terms_tldr_blocks'
  info: {
    displayName: 'tldr-block'
  }
  attributes: {
    bullets: Schema.Attribute.Component<'terms.tldr-bullet', true>
    closingNote: Schema.Attribute.Text
    heading: Schema.Attribute.String
    intro: Schema.Attribute.Text
    showOnBookingPage: Schema.Attribute.Boolean
  }
}

export interface TermsTldrBullet extends Struct.ComponentSchema {
  collectionName: 'components_terms_tldr_bullets'
  info: {
    displayName: 'tldr-bullet'
  }
  attributes: {
    icon: Schema.Attribute.String
    text: Schema.Attribute.Text
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'cms.content-section': CmsContentSection
      'cms.navigation-item': CmsNavigationItem
      'package.bartendingpackage': PackageBartendingpackage
      'package.categories': PackageCategories
      'package.category-item': PackageCategoryItem
      'package.decorpackages': PackageDecorpackages
      'package.flavors': PackageFlavors
      'package.inclusions': PackageInclusions
      'package.package-addon': PackagePackageAddon
      'package.package-element': PackagePackageElement
      'package.package-pricing-rule': PackagePackagePricingRule
      'package.sheeshapackage': PackageSheeshapackage
      'shared.exclusion-item': SharedExclusionItem
      'shared.price-breakdown-item': SharedPriceBreakdownItem
      'shared.price-covers-item': SharedPriceCoversItem
      'shared.sections': SharedSections
      'terms.clause': TermsClause
      'terms.section': TermsSection
      'terms.tldr-block': TermsTldrBlock
      'terms.tldr-bullet': TermsTldrBullet
    }
  }
}
