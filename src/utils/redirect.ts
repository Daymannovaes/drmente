import { analytics } from "./analytics";

function redirect(url: string, newTab: boolean = false) {
  analytics.trackCustom('redirect-to-external-link', { url, newTab });

  if (newTab) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}

export { redirect };
