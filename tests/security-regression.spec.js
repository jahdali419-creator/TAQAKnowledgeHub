// Cross-cutting security regression sweep.
//
// PURPOSE: this file is the app-wide security checklist, not another XSS
// spec — page-specific injection/XSS coverage lives in each page's own
// spec file (see tests/upload.spec.js, tests/documents.spec.js, etc.).
// What lives here instead: no leaked secrets in what actually gets served,
// the CSP's current (known, accepted) policy is pinned so a future change
// is caught, a spot-check that external links are safe, a regression guard
// that roles.js keeps disclaiming itself as a real security boundary, and
// a minimal check that upload.html's file-extension allow-list has not
// quietly grown permissive.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('./helpers/fixtures');

const ROOT = path.resolve(__dirname, '..');

// Directories that are never actually served to a browser as app source.
const EXCLUDE_DIRS = new Set([
  'node_modules',
  'tests',
  'docs',
  'playwright-report',
  'test-results',
  '.git',
]);

function collectServedFiles(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      out = out.concat(collectServedFiles(path.join(dir, entry.name)));
    } else if (/\.(html|js|json|css)$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

test.describe('no secrets/credentials in served static files', () => {
  // Deliberately kept small and specific: patterns that fire on real key
  // material, not on the word "password" appearing as a form label or a
  // placeholder, which this static demo app uses plenty of legitimately
  // (login mockups, role-switcher copy, etc).
  const SECRET_PATTERNS = [
    { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/g },
    {
      name: 'AWS secret key assignment',
      re: /aws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+=]{30,}['"]/gi,
    },
    {
      name: 'Generic api_key assignment with a real-looking value',
      re: /\b(api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/gi,
    },
    {
      name: 'Generic secret assignment with a real-looking value',
      re: /\bsecret\s*[:=]\s*['"][A-Za-z0-9_-]{12,}['"]/gi,
    },
    {
      name: 'Password assignment with a real-looking value',
      re: /\bpassword\s*[:=]\s*['"][^'"]{6,}['"]/gi,
    },
    {
      name: 'PEM private key header',
      re: /-----BEGIN (RSA |EC |DSA |OPENSSH |)PRIVATE KEY-----/g,
    },
    { name: 'Slack token', re: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
    { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
    { name: 'JWT-shaped token', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
    { name: 'Azure storage account key', re: /AccountKey=[A-Za-z0-9+/=]{20,}/g },
  ];

  test('every served .html/.js/.json/.css file is clean of common secret patterns', () => {
    const files = collectServedFiles(ROOT);
    expect(files.length, 'served files found to scan').toBeGreaterThan(10);

    const offenders = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        const matches = src.match(pattern.re);
        if (matches) {
          offenders.push(`${path.relative(ROOT, file)}: ${pattern.name} (${matches.length} match(es))`);
        }
      }
    }
    expect(offenders, 'files matching a secret pattern').toEqual([]);
  });
});

test.describe('Content-Security-Policy', () => {
  // This app has no CSP response header (staticwebapp.config.json's
  // globalHeaders carries X-Content-Type-Options / X-Frame-Options /
  // Referrer-Policy / HSTS, but no Content-Security-Policy); the policy
  // instead lives as a <meta http-equiv="Content-Security-Policy"> tag,
  // identical on every page that has one. It already includes
  // 'unsafe-inline' for both script-src and style-src — a known, already
  // flagged, ACCEPTED limitation for this prototype stage (the app relies
  // heavily on inline <script>/<style>, and locking that down is future
  // work). This test does not try to fix that; it pins the exact current
  // policy string so a future unintended change (tightened OR further
  // loosened) is caught.
  const EXPECTED_CSP =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; " +
    "manifest-src 'self'";

  const PAGES_WITH_CSP_META = [
    'index.html',
    'segment.html',
    'viewer.html',
    'documents.html',
    'master-list.html',
    'ai-search.html',
    'dashboard.html',
    'glossary.html',
    'upload.html',
    'support-ticket.html',
    'whats-new.html',
    'analytics.html',
  ];

  test('staticwebapp.config.json carries no Content-Security-Policy header of its own', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'staticwebapp.config.json'), 'utf8')
    );
    expect(config.globalHeaders || {}).not.toHaveProperty('Content-Security-Policy');
    for (const route of config.routes || []) {
      expect(route.headers || {}).not.toHaveProperty('Content-Security-Policy');
    }
  });

  for (const page of PAGES_WITH_CSP_META) {
    test(`${page}'s CSP <meta> tag matches the documented current policy (unsafe-inline included, known/accepted)`, () => {
      const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
      const match = src.match(
        /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/
      );
      expect(match, `${page} has a CSP <meta> tag`).not.toBeNull();
      expect(match[1]).toBe(EXPECTED_CSP);
    });
  }
});

test.describe('external links', () => {
  // A representative sample of pages, including the one page that actually
  // ships an external, target="_blank" link today (index.html's
  // #BetterTogether@TAQA Viva Engage link).
  const SAMPLE_PAGES = [
    '/index.html',
    '/segment.html?id=coiled-tubing',
    '/documents.html?id=coiled-tubing',
    '/dashboard.html?id=coiled-tubing',
    '/upload.html',
    '/ai-search.html',
  ];

  for (const p of SAMPLE_PAGES) {
    test(`${p} has no target="_blank" link missing rel="noopener"`, async ({
      page,
      gotoApp,
      setRole,
    }) => {
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp(p);

      const unsafe = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[target="_blank"]'))
          .filter((a) => !/\bnoopener\b/.test(a.getAttribute('rel') || ''))
          .map((a) => a.outerHTML.slice(0, 120))
      );
      expect(unsafe, `${p}: target=_blank links missing rel=noopener`).toEqual([]);
    });
  }

  test('the known external link (index.html Viva Engage) is correctly guarded', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    const link = page.locator('a[href*="engage.cloud.microsoft"]');
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
  });
});

test.describe('client-side role checks are documented as NOT a security boundary', () => {
  // This is intentional and correct for the current prototype stage: there
  // is no backend yet, so there is nothing to enforce server-side. The
  // regression this guards against is someone quietly deleting the
  // disclaimer (accidentally implying the client-side matrix IS a real
  // boundary), not the absence of server-side auth itself.
  test('roles.js file header still says outright it is a specification, not a control', () => {
    const src = fs.readFileSync(path.join(ROOT, 'roles.js'), 'utf8');
    const header = src.slice(0, 1500);
    expect(header).toMatch(/THIS IS A SPECIFICATION, NOT A SECURITY CONTROL/);
    expect(header).toMatch(/runs in the browser, so it can be bypassed/i);
    expect(header).toMatch(/the client must never be/i);
  });
});

test.describe('upload.html file-extension allow-list', () => {
  // Minimal, source-level check: the allow-list array itself has not
  // quietly grown permissive. Behavioral coverage (drag/drop, double
  // extensions, actual rejection UI) already lives in tests/upload.spec.js
  // — this only guards the list's contents.
  const DANGEROUS_EXTENSIONS = ['exe', 'bat', 'sh', 'msi', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'jar'];

  test('ALLOWED_EXT excludes every dangerous/executable extension', () => {
    const src = fs.readFileSync(path.join(ROOT, 'upload.html'), 'utf8');
    const match = src.match(/const ALLOWED_EXT = \[([^\]]+)\];/);
    expect(match, 'ALLOWED_EXT array found in upload.html').not.toBeNull();

    const allowed = match[1]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);

    expect(allowed.length).toBeGreaterThan(0);
    for (const dangerous of DANGEROUS_EXTENSIONS) {
      expect(allowed, `ALLOWED_EXT must not contain "${dangerous}"`).not.toContain(dangerous);
    }

    // And it still only permits genuine document/archive types.
    const expectedShape = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
    expect(allowed.sort()).toEqual(expectedShape.sort());
  });

  test("the input's accept attribute is not more permissive than ALLOWED_EXT", () => {
    // accept is a UX hint only (documented as such right above ALLOWED_EXT
    // in upload.html), but it should not advertise types the JS allow-list
    // would then silently reject.
    const src = fs.readFileSync(path.join(ROOT, 'upload.html'), 'utf8');
    const acceptMatch = src.match(/id="file-input"[^>]*accept="([^"]+)"/);
    expect(acceptMatch, 'file-input accept attribute found').not.toBeNull();
    const acceptExts = acceptMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^\./, ''))
      .filter(Boolean);
    for (const ext of acceptExts) {
      expect(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip']).toContain(ext);
    }
  });
});
