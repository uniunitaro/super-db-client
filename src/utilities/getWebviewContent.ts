import type { Uri, Webview } from 'vscode'
import { getNonce } from './getNonce'
import { getUri } from './getUri'

/**
 * Defines and returns the HTML that should be rendered within the webview panel.
 *
 * @remarks This is also the place where references to the React webview build files
 * are created and inserted into the webview HTML.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export const getWebviewContent = (
  webview: Webview,
  extensionUri: Uri,
  routeName: `/${string}`,
) => {
  // The CSS file from the React build output
  const stylesUri = getUri(webview, extensionUri, [
    'webview-ui',
    'build',
    'assets',
    'index.css',
  ])
  // The JS file from the React build output
  const scriptUri = getUri(webview, extensionUri, [
    'webview-ui',
    'build',
    'assets',
    'index.js',
  ])

  const codiconUri = getUri(webview, extensionUri, [
    'webview-ui',
    'build',
    'assets',
    'codicon.css',
  ])

  const nonce = getNonce()

  // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
  return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" type="text/css" href="${codiconUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root" data-route="${routeName}"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `
}
