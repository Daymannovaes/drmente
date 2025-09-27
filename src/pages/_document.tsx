import { Html, Head, Main, NextScript } from "next/document";
import { FacebookPixelHead, FacebookPixelNoscript } from "@/components/FacebookPixelDocument";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <FacebookPixelHead />
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
