# Security

Every app here is a single HTML file that makes no network requests and keeps
data in the browser. If you find a way to break that (data leaving the device,
script injection through imported data, a CSP bypass, a malicious asset),
please report it privately through
[GitHub private vulnerability reporting](https://github.com/b-niamin/onefile-apps/security/advisories/new)
instead of opening a public issue.

What the checks enforce on every pull request:

- strict Content-Security-Policy (`default-src 'none'`, `connect-src 'none'`)
- no external scripts, styles, fonts, images, iframes, `fetch`, XHR, WebSocket, beacons, cookies, service workers
- no `eval`, `new Function`, `document.write`
- a real-browser smoke test that fails on any network request
- built files match their sources

Each app is also reviewed by a maintainer before it is marked stable.
