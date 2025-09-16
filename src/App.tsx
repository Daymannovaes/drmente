import { posthog } from "posthog-js";

export default function App() {
  posthog.capture('my event', { property: 'value' })
  console.log('my event', { property: 'value' })

  return <div></div>;
}
