// In case we want to try server-side rendering
const template = () => {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <title>follow.me</title>
        <base href="/">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/png" href="assets/favicon.png" />
      </head>
      <body ng-app="app" ng-strict-di ng-cloak>
        <app>
          <div id="app">
            <!-- Temporary improvement of "Loading" placeholder -->
            <h1 style="
              font-family: 'Helvetica Neue', Arial, san-serif;
              font-size: 44px;
              font-weight: 100;
              letter-spacing: 0.4px;
              margin-left: 40px;
              margin-top: 24px;
            ">
              Loading...
            </h1>
          </div>
        </app>

        <script
          type="text/javascript"
          src="bundle.js"
          charset="utf-8">
        </script>
      </body>
    </html>
  `;
};

module.exports = {
  template
};
