import { posthog } from "posthog-js";

export default function App() {
  // helper to read Meta’s click/browser IDs if present
  function readCookie(n){return document.cookie.split('; ').find(r=>r.startsWith(n+'='))?.split('=')[1]}

  function dispatchLead() {
    console.log('dispatching lead');
    // mirror the Lead to PostHog with useful properties
    posthog.capture('Lead', {
      action_source: 'website',
      event_source_url: location.href,
      client_user_agent: navigator.userAgent,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),          // present if the user arrived via a Meta ad click
      // include any identifiers you have:
      email: window.userEmail || undefined,
      phone: window.userPhone || undefined,
      external_id: window.userId || undefined
    });
  }

  // Check if this is the success page
  dispatchLead();
  dispatchLead();
  dispatchLead();
  // if (window.location.pathname.includes('sucesso')) {
  // }



  return <div></div>;
}
