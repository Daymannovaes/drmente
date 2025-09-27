const FB_PIXEL_ID = "1358024049025263";

// This component is specifically designed for _document.tsx
export function FacebookPixelHead() {
  return (
    <>
      {/* Facebook Pixel Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');

            fbq('track', 'PageView');
          `
        }}
      />
      <meta name="facebook-domain-verification" content="lb3mkgfapxrjap6h1faiytcyrlghdm" />
    </>
  );
}

export function FacebookPixelNoscript() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        height="1"
        width="1"
        style={{display: 'none'}}
        src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </>
  );
}
