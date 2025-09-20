export function sendNtfy(message: string, url: string = 'https://ntfy.sh/drmente-prod-grafqk0d37b5') {
  const payload = {
    message: message
  };

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
