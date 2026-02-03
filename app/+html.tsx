import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <script src="https://pl28642504.effectivegatecpm.com/1a/62/ca/1a62cac51371546199f6c51eca739577.js"></script>
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>
        {children}
        <div
          id="ad-script-container"
          style={{
            backgroundColor: '#0000ff',
            border: '2px solid #ffffff',
            boxSizing: 'border-box',
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 160,
            height: 90,
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <script
            dangerouslySetInnerHTML={{
              __html: `
  atOptions = {
    'key' : 'b6eb691e5caffcd705c44b3d16527f47',
    'format' : 'iframe',
    'height' : 90,
    'width' : 160,
    'params' : {}
  };
`,
            }}
          />
          <script src="https://www.highperformanceformat.com/b6eb691e5caffcd705c44b3d16527f47/invoke.js"></script>
        </div>
      </body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
