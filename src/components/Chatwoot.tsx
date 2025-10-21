export function ChatwootScript() {
  return (
    <>
      <script
          id="chatwoot-sdk"
          dangerouslySetInnerHTML={{
            __html: `
              (function(d,t) {
                var BASE_URL="https://app.chatwoot.com";
                var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  window.chatwootSDK.run({
                    websiteToken: 'vbu3DNS1bX6ykdMZYv5BMsWZ',
                    baseUrl: BASE_URL
                  })
                }
              })(document,"script");
            `
          }}
        />
    </>
  );
}
