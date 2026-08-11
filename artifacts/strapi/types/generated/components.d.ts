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

export interface ContactCareerConsent extends Struct.ComponentSchema {
  collectionName: 'components_contact_career_consents';
  info: {
    description: 'Karrier t\u00E1rgy eset\u00E9n megjelen\u0151 hozz\u00E1j\u00E1rul\u00E1s-checkboxok';
    displayName: 'Career Consent Checkboxes';
    icon: 'check';
  };
  attributes: {
    checkbox1Text: Schema.Attribute.Text;
    checkbox2Text: Schema.Attribute.Text;
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
    isCareer: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
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

export interface ServiceBulletPoint extends Struct.ComponentSchema {
  collectionName: 'components_service_bullet_points';
  info: {
    description: 'Egyetlen felsorol\u00E1si pont';
    displayName: 'Felsorol\u00E1s pont';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceDeliverableCard extends Struct.ComponentSchema {
  collectionName: 'components_service_deliverable_cards';
  info: {
    description: 'Amit a projektb\u0151l kapsz \u2014 kis k\u00E1rtya';
    displayName: 'Kis ikonos k\u00E1rtya (A v\u00E1ltozat)';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceDeliverableGroup extends Struct.ComponentSchema {
  collectionName: 'components_service_deliverable_groups';
  info: {
    description: 'Amit a projektb\u0151l kapsz \u2014 nagy k\u00E1rtya felsorol\u00E1ssal';
    displayName: 'Nagy k\u00E1rtya felsorol\u00E1ssal (B v\u00E1ltozat)';
    icon: 'apps';
  };
  attributes: {
    bullets: Schema.Attribute.Component<'service.bullet-point', true>;
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceDeliverablesSection extends Struct.ComponentSchema {
  collectionName: 'components_service_deliverables_sections';
  info: {
    description: 'K\u00E9t megjelen\u00EDt\u00E9si v\u00E1ltozat: kis k\u00E1rty\u00E1k (A) vagy nagy k\u00E1rty\u00E1k felsorol\u00E1ssal (B)';
    displayName: '5. \u201EAmit a projektb\u0151l kapsz\u201D szekci\u00F3';
    icon: 'gift';
  };
  attributes: {
    intro: Schema.Attribute.Component<'service.section-intro', false>;
    largeCards: Schema.Attribute.Component<'service.deliverable-group', true>;
    smallCards: Schema.Attribute.Component<'service.deliverable-card', true>;
    variant: Schema.Attribute.Enumeration<['smallCards', 'largeCards']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'smallCards'>;
  };
}

export interface ServiceFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_service_faq_items';
  info: {
    description: 'K\u00E9rd\u00E9s-v\u00E1lasz p\u00E1r';
    displayName: 'GYIK elem';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceFaqSection extends Struct.ComponentSchema {
  collectionName: 'components_service_faq_sections';
  info: {
    description: 'Gyakran ism\u00E9telt k\u00E9rd\u00E9sek leny\u00EDl\u00F3 list\u00E1ja';
    displayName: '7. GYIK szekci\u00F3';
    icon: 'question';
  };
  attributes: {
    intro: Schema.Attribute.Component<'service.section-intro', false>;
    items: Schema.Attribute.Component<'service.faq-item', true>;
  };
}

export interface ServiceGeneral extends Struct.ComponentSchema {
  collectionName: 'components_service_generals';
  info: {
    description: 'Az oldal tetej\u00E9n megjelen\u0151 c\u00EDm, alc\u00EDm, le\u00EDr\u00E1s \u00E9s ikon, valamint a szolg\u00E1ltat\u00E1s webc\u00EDme (slug)';
    displayName: '1. \u00C1ltal\u00E1nos adatok + fejl\u00E9c (hero)';
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

export interface ServiceHelpCard extends Struct.ComponentSchema {
  collectionName: 'components_service_help_cards';
  info: {
    description: 'Miben tudunk seg\u00EDteni k\u00E1rtya';
    displayName: 'Seg\u00EDts\u00E9g k\u00E1rtya';
    icon: 'check-circle';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceHelpSection extends Struct.ComponentSchema {
  collectionName: 'components_service_help_sections';
  info: {
    description: 'Ikonos k\u00E1rtyar\u00E1cs a szolg\u00E1ltat\u00E1s ter\u00FCleteir\u0151l';
    displayName: '3. \u201EMiben tudunk seg\u00EDteni?\u201D szekci\u00F3';
    icon: 'grid';
  };
  attributes: {
    cards: Schema.Attribute.Component<'service.help-card', true>;
    intro: Schema.Attribute.Component<'service.section-intro', false>;
  };
}

export interface ServiceProcessSection extends Struct.ComponentSchema {
  collectionName: 'components_service_process_sections';
  info: {
    description: 'Sz\u00E1mozott folyamatl\u00E9p\u00E9sek id\u0151vonalon';
    displayName: '4. \u201EHogyan dolgozunk?\u201D szekci\u00F3';
    icon: 'arrow-right';
  };
  attributes: {
    intro: Schema.Attribute.Component<'service.section-intro', false>;
    steps: Schema.Attribute.Component<'service.process-step', true>;
  };
}

export interface ServiceProcessStep extends Struct.ComponentSchema {
  collectionName: 'components_service_process_steps';
  info: {
    description: 'Hogyan dolgozunk l\u00E9p\u00E9s';
    displayName: 'Folyamat l\u00E9p\u00E9s';
    icon: 'arrow-right';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceQuestionCard extends Struct.ComponentSchema {
  collectionName: 'components_service_question_cards';
  info: {
    description: 'K\u00E9rd\u00E9sk\u00E1rtya c\u00EDm \u00E9s le\u00EDr\u00E1s';
    displayName: 'K\u00E9rd\u00E9sk\u00E1rtya';
    icon: 'question';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServiceQuestionsSection extends Struct.ComponentSchema {
  collectionName: 'components_service_questions_sections';
  info: {
    description: 'A fejl\u00E9c alatti k\u00E9rd\u00E9sk\u00E1rty\u00E1s szekci\u00F3';
    displayName: '2. \u201EMilyen k\u00E9rd\u00E9sekre seg\u00EDt\u00FCnk v\u00E1laszt tal\u00E1lni?\u201D szekci\u00F3';
    icon: 'question';
  };
  attributes: {
    cards: Schema.Attribute.Component<'service.question-card', true>;
    intro: Schema.Attribute.Component<'service.section-intro', false>;
  };
}

export interface ServiceSectionIntro extends Struct.ComponentSchema {
  collectionName: 'components_service_section_intros';
  info: {
    description: 'Szekci\u00F3 fels\u0151 c\u00EDmke, c\u00EDm \u00E9s le\u00EDr\u00E1s';
    displayName: 'Szekci\u00F3 bevezet\u0151 (c\u00EDmke + c\u00EDm + le\u00EDr\u00E1s)';
    icon: 'layout';
  };
  attributes: {
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
    kicker: Schema.Attribute.String;
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
      'contact.career-consent': ContactCareerConsent;
      'contact.form-subject': ContactFormSubject;
      'content.highlight-block': ContentHighlightBlock;
      'content.image-block': ContentImageBlock;
      'content.text-block': ContentTextBlock;
      'homepage.blog-section': HomepageBlogSection;
      'homepage.cta-banner': HomepageCtaBanner;
      'homepage.hero': HomepageHero;
      'homepage.projects-section': HomepageProjectsSection;
      'homepage.services-section': HomepageServicesSection;
      'project.case-study': ProjectCaseStudy;
      'service.bullet-point': ServiceBulletPoint;
      'service.deliverable-card': ServiceDeliverableCard;
      'service.deliverable-group': ServiceDeliverableGroup;
      'service.deliverables-section': ServiceDeliverablesSection;
      'service.faq-item': ServiceFaqItem;
      'service.faq-section': ServiceFaqSection;
      'service.general': ServiceGeneral;
      'service.help-card': ServiceHelpCard;
      'service.help-section': ServiceHelpSection;
      'service.process-section': ServiceProcessSection;
      'service.process-step': ServiceProcessStep;
      'service.question-card': ServiceQuestionCard;
      'service.questions-section': ServiceQuestionsSection;
      'service.section-intro': ServiceSectionIntro;
      'shared.hero': SharedHero;
      'shared.legal-link': SharedLegalLink;
      'shared.opening-hours': SharedOpeningHours;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
    }
  }
}
