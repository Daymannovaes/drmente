import { Html, Head, Main, NextScript } from "next/document";
import { FacebookPixelHead, FacebookPixelNoscript } from "@/components/FacebookPixelDocument";
import { ChatwootScript } from "@/components/Chatwoot";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <FacebookPixelHead />
        <ChatwootScript />
      </Head>
      <body className="antialiased">
        <noscript>
          <FacebookPixelNoscript />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
