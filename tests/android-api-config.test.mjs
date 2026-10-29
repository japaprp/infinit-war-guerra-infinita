import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const configSource = fs.readFileSync(new URL('../frontend/public/api/config.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../frontend/public/index.html', import.meta.url), 'utf8');
const mainSource = fs.readFileSync(new URL('../frontend/public/main.js', import.meta.url), 'utf8');
const capacitor = JSON.parse(fs.readFileSync(new URL('../capacitor.config.json', import.meta.url), 'utf8'));

function resolveApi(hostname, metaContent = '') {
  const window = { location: { hostname } };
  const document = { querySelector: (selector) => selector === 'meta[name="iwar-api-base-url"]' ? { content: metaContent } : null };
  vm.runInNewContext(configSource, { window, document, URL });
  return window;
}

test('Capacitor Android localhost uses the configured hosted HTTPS API, not device localhost', () => {
  const result = resolveApi('localhost', 'https://infinit-war-api.onrender.com');
  assert.equal(result.IWAR_API_BASE_URL, 'https://infinit-war-api.onrender.com');
  assert.equal(result.GDE_API_BASE_URL, result.IWAR_API_BASE_URL);
  assert.equal(result.IWAR_API_CONFIG_ERROR, '');
});

test('local browser development may use localhost API when no hosted URL is configured', () => {
  const result = resolveApi('localhost');
  assert.equal(result.IWAR_API_BASE_URL, 'http://localhost:4000');
});

test('remote clients fail closed when the API origin is not configured', () => {
  const result = resolveApi('game.example.invalid');
  assert.equal(result.IWAR_API_BASE_URL, '');
});

test('remote clients reject insecure HTTP API origins', () => {
  const result = resolveApi('localhost', 'http://api.example.invalid');
  assert.equal(result.IWAR_API_BASE_URL, '');
  assert.match(result.IWAR_API_CONFIG_ERROR, /exact HTTPS origin/);
});

test('Android package uses the reviewed browser client and HTTPS scheme without cleartext traffic', () => {
  assert.equal(capacitor.appId, 'com.infinitwar.guerrainfinita');
  assert.equal(capacitor.appName, 'Guerra Infinita');
  assert.equal(capacitor.webDir, 'frontend/public');
  assert.equal(capacitor.server.androidScheme, 'https');
  assert.equal(capacitor.server.cleartext, false);
  assert.match(html, /meta name="iwar-api-base-url" content="https:\/\/infinit-war-api\.onrender\.com"/);
  assert.match(html, /connect-src[^>]*https:\/\/infinit-war-api\.onrender\.com/);
});

test('Android entry exposes working Firebase email login and account creation controls', () => {
  for (const id of ['emailAuthForm', 'authEmail', 'authPassword', 'emailLoginBtn', 'emailRegisterBtn', 'googleLoginBtn', 'authStatus', 'startGameBtn']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing login control: ' + id);
  }
  assert.match(html, /auth\/auth\.js/);
  assert.match(html, /firebase-auth-compat\.js/);
  assert.doesNotMatch(html, /data-element="(?:fire|water|earth)"/);
});

test('entry navigation permits a logged-in user to continue without a nickname or element selection', () => {
  assert.match(mainSource, /session\.uid/);
  assert.match(mainSource, /session\.email/);
  assert.match(mainSource, /localStorage\.setItem\("playerElement", "Comandante"\)/);
  assert.match(mainSource, /window\.location\.href = "game\.html"/);
  assert.match(mainSource, /sourceNick = typedNick \|\| session\.displayName/);
});
