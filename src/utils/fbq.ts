// Facebook Pixel utility functions
declare global {
  interface Window {
    fbq: (action: 'track' | 'trackCustom' | 'init', event: string, params?: Record<string, unknown>) => void;
  }
}

export const fbq = {
  // Track page view
  trackPageView: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  },

  // Track lead conversion
  trackLead: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead');
    }
  },

  // Track custom events
  trackCustom: (eventName: string, params?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, params);
    }
  },
};
