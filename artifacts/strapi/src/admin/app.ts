declare const window: {
  localStorage: Storage;
  document: Document;
} | undefined;

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface Document {
  cookie: string;
}

export default {
  config: {
    locales: ['hu'],
    translations: {
      hu: {
        'app.components.LeftMenu.navbrand.title': 'Works. CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Admin',
      },
    },
  },
  bootstrap() {
    if (typeof window === 'undefined') return;

    const ls = window.localStorage;
    const doc = window.document;

    const stored = ls.getItem('jwtToken');
    if (stored === '""' || stored === 'null' || stored === '') {
      ls.removeItem('jwtToken');
    }

    const proto = Object.getPrototypeOf(doc);
    const desc: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(proto, 'cookie') ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(proto), 'cookie');
    if (!desc || !desc.get || !desc.set) return;

    const originalGet = desc.get;
    const originalSet = desc.set;
    const LS_KEY = '__cookie_jwtToken';

    Object.defineProperty(doc, 'cookie', {
      get() {
        const real: string = originalGet.call(this);
        const saved = ls.getItem(LS_KEY);
        if (!saved) return real;
        const hasJwt = real.split(';').some((c: string) => c.trim().startsWith('jwtToken='));
        if (hasJwt) return real;
        return real ? `${real}; jwtToken=${saved}` : `jwtToken=${saved}`;
      },
      set(val: string) {
        originalSet.call(this, val);
        if (typeof val === 'string' && val.startsWith('jwtToken=')) {
          const match = val.match(/^jwtToken=([^;]*)/);
          if (match) {
            const raw = match[1];
            const isExpired =
              val.includes('Expires=Thu, 01 Jan 1970') ||
              val.includes('expires=Thu, 01 Jan 1970') ||
              val.includes('max-age=0') ||
              val.includes('Max-Age=0');
            if (isExpired) {
              ls.removeItem(LS_KEY);
              ls.removeItem('jwtToken');
            } else if (raw) {
              ls.setItem(LS_KEY, raw);
              ls.setItem('jwtToken', JSON.stringify(decodeURIComponent(raw)));
            }
          }
        }
      },
      configurable: true,
    });
  },
};
