import type { Schema, Struct } from '@strapi/strapi';

export interface AboutIntro extends Struct.ComponentSchema {
  collectionName: 'components_about_intros';
  info: {
    description: 'R\u00F3lunk bemutatkoz\u00E1s';
    displayName: 'About Intro';
    icon: 'information';
  };
  attributes: {
    body: Schema.Attribute.RichText;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
  };
}

export interface CareerWhyUsItem extends Struct.ComponentSchema {
  collectionName: 'components_career_why_us_items';
  info: {
    description: 'Mi\u00E9rt j\u00F3 n\u00E1lunk dolgozni k\u00E1rtya';
    displayName: 'Why us item';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CareerWhyUsSection extends Struct.ComponentSchema {
  collectionName: 'components_career_why_us_sections';
  info: {
    description: 'Mi\u00E9rt j\u00F3 n\u00E1lunk dolgozni szekci\u00F3';
    displayName: 'Mi\u00E9rt j\u00F3 n\u00E1lunk dolgozni?';
  };
  attributes: {
    items: Schema.Attribute.Component<'career.why-us-item', true>;
    sectionHeading: Schema.Attribute.String;
  };
}

export interface CareerWorkWithUs extends Struct.ComponentSchema {
  collectionName: 'components_career_work_with_us';
  info: {
    description: 'Dolgozz vel\u00FCnk szekci\u00F3';
    displayName: 'Dolgozz vel\u00FCnk';
  };
  attributes: {
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
  };
}

export interface ContactFormSubject extends Struct.ComponentSchema {
  collectionName: 'components_contact_form_subjects';
  info: {
    description: 'Kapcsolati \u0171rlap t\u00E1rgy';
    displayName: 'Form Subject';
    icon: 'list';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContentHighlightBlock extends Struct.ComponentSchema {
  collectionName: 'components_content_highlight_blocks';
  info: {
    description: 'Kiemelt id\u00E9zet blokk';
    displayName: 'Highlight Block';
    icon: 'quote';
  };
  attributes: {
    quote: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ContentImageBlock extends Struct.ComponentSchema {
  collectionName: 'components_content_image_blocks';
  info: {
    description: 'K\u00E9pes blokk';
    displayName: 'Image Block';
    icon: 'picture';
  };
  attributes: {
    caption: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface ContentTextBlock extends Struct.ComponentSchema {
  collectionName: 'components_content_text_blocks';
  info: {
    description: 'Sz\u00F6veges blokk';
    displayName: 'Text Block';
    icon: 'align-left';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface HomepageBlogSection extends Struct.ComponentSchema {
  collectionName: 'components_homepage_blog_sections';
  info: {
    description: 'Blog szekci\u00F3';
    displayName: 'Blog Section';
    icon: 'file-text';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageClientsSection extends Struct.ComponentSchema {
  collectionName: 'components_homepage_clients_sections';
  info: {
    description: '\u00DCgyfelek szekci\u00F3';
    displayName: 'Clients Section';
    icon: 'users';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_homepage_cta_banners';
  info: {
    description: 'CTA banner szekci\u00F3';
    displayName: 'CTA Banner';
    icon: 'megaphone';
  };
  attributes: {
    ctaLink: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageHero extends Struct.ComponentSchema {
  collectionName: 'components_homepage_heroes';
  info: {
    description: 'F\u0151oldal hero szekci\u00F3';
    displayName: 'Homepage Hero';
    icon: 'layout';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    highlightedWord: Schema.Attribute.String;
    primaryCtaLink: Schema.Attribute.String;
    primaryCtaText: Schema.Attribute.String;
    secondaryCtaLink: Schema.Attribute.String;
    secondaryCtaText: Schema.Attribute.String;
  };
}

export interface HomepageProjectsSection extends Struct.ComponentSchema {
  collectionName: 'components_homepage_projects_sections';
  info: {
    description: 'Projektek szekci\u00F3';
    displayName: 'Projects Section';
    icon: 'briefcase';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageServicesSection extends Struct.ComponentSchema {
  collectionName: 'components_homepage_services_sections';
  info: {
    description: 'Szolg\u00E1ltat\u00E1sok szekci\u00F3';
    displayName: 'Services Section';
    icon: 'apps';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProjectCaseStudy extends Struct.ComponentSchema {
  collectionName: 'components_project_case_studies';
  info: {
    description: 'Esettanulm\u00E1ny adatok';
    displayName: 'Case Study';
    icon: 'book';
  };
  attributes: {
    client: Schema.Attribute.String;
    duration: Schema.Attribute.String;
    heroSubtitle: Schema.Attribute.Text;
    year: Schema.Attribute.String;
  };
}

export interface ServiceActivity extends Struct.ComponentSchema {
  collectionName: 'components_service_activities';
  info: {
    description: 'Szolg\u00E1ltat\u00E1si tev\u00E9kenys\u00E9g';
    displayName: 'Activity';
    icon: 'check-circle';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceBenefit extends Struct.ComponentSchema {
  collectionName: 'components_service_benefits';
  info: {
    description: 'Szolg\u00E1ltat\u00E1s el\u0151nye';
    displayName: 'Benefit';
    icon: 'thumbs-up';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceGeneral extends Struct.ComponentSchema {
  collectionName: 'components_service_generals';
  info: {
    description: '\u00C1ltal\u00E1nos szolg\u00E1ltat\u00E1si adatok';
    displayName: 'General (listing + hero)';
    icon: 'layout';
  };
  attributes: {
    heroDescription: Schema.Attribute.Text;
    heroImage: Schema.Attribute.Media<'images'>;
    icon: Schema.Attribute.Media<'images'>;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceTool extends Struct.ComponentSchema {
  collectionName: 'components_service_tools';
  info: {
    description: 'Haszn\u00E1lt eszk\u00F6z';
    displayName: 'Tool';
    icon: 'wrench';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceValueProposition extends Struct.ComponentSchema {
  collectionName: 'components_service_value_propositions';
  info: {
    description: '\u00C9rt\u00E9kaj\u00E1nlat szekci\u00F3';
    displayName: '\u00C9rt\u00E9kaj\u00E1nlat';
    icon: 'quote';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.String;
  };
}

export interface SharedHero extends Struct.ComponentSchema {
  collectionName: 'components_shared_heroes';
  info: {
    description: 'Hero szekci\u00F3';
    displayName: 'Hero';
    icon: 'layout';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLegalLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_legal_links';
  info: {
    description: 'Jogi hivatkoz\u00E1s';
    displayName: 'Legal Link';
    icon: 'file';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedOpeningHours extends Struct.ComponentSchema {
  collectionName: 'components_shared_opening_hours';
  info: {
    description: 'Nyitvatart\u00E1si id\u0151';
    displayName: 'Opening Hours';
    icon: 'clock';
  };
  attributes: {
    day: Schema.Attribute.String & Schema.Attribute.Required;
    hours: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO metaadatok';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'K\u00F6z\u00F6ss\u00E9gi m\u00E9dia link';
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    platform: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about.intro': AboutIntro;
      'career.why-us-item': CareerWhyUsItem;
      'career.why-us-section': CareerWhyUsSection;
      'career.work-with-us': CareerWorkWithUs;
      'contact.form-subject': ContactFormSubject;
      'content.highlight-block': ContentHighlightBlock;
      'content.image-block': ContentImageBlock;
      'content.text-block': ContentTextBlock;
      'homepage.blog-section': HomepageBlogSection;
      'homepage.clients-section': HomepageClientsSection;
      'homepage.cta-banner': HomepageCtaBanner;
      'homepage.hero': HomepageHero;
      'homepage.projects-section': HomepageProjectsSection;
      'homepage.services-section': HomepageServicesSection;
      'project.case-study': ProjectCaseStudy;
      'service.activity': ServiceActivity;
      'service.benefit': ServiceBenefit;
      'service.general': ServiceGeneral;
      'service.tool': ServiceTool;
      'service.value-proposition': ServiceValueProposition;
      'shared.hero': SharedHero;
      'shared.legal-link': SharedLegalLink;
      'shared.opening-hours': SharedOpeningHours;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
    }
  }
}
