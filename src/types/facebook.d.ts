// Facebook Pixel type declarations
declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom' | 'init',
      event: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: {
      push: (args: unknown[]) => void;
    };
  }
}

export {};
