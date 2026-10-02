/* TechHub runtime configuration: EXAMPLE ONLY, placeholders, no secrets.
 *
 * Not loaded by any page today. It shows the shape a per-environment
 * configuration file should take once IT integrates Azure, so values that
 * change between LOCAL / DEV / TEST(UAT) / PRODUCTION live in one place
 * instead of inside the pages. See docs/AZURE-INTEGRATION-REQUIREMENTS.md §2
 * for where each value lives in the prototype today and how to adopt this.
 *
 * Suggested use: copy to config/techhub.config.js per environment (that file
 * is git-ignored), load it with <script src="config/techhub.config.js">
 * before shared.js, and read window.TECHHUB_CONFIG instead of literals.
 *
 * A browser configuration file is PUBLIC. Never put a client secret, storage
 * key, connection string or SAS token here. Entra client IDs and tenant IDs
 * are identifiers, not secrets, and are expected in a single-page app.
 */
window.TECHHUB_CONFIG = {
  environment: '<LOCAL | DEV | UAT | PROD>',

  // Base address of the TechHub API (docs/API-REQUIREMENTS.md).
  apiBaseUrl: '<https://api-host.example/techhub/v1>',
  apiTimeoutMs: 15000,

  // Microsoft Entra ID (MSAL.js or the hosting platform's built-in auth).
  entra: {
    tenantId: '<ENTRA_TENANT_ID>',
    clientId: '<SPA_APP_REGISTRATION_CLIENT_ID>',
    authority: 'https://login.microsoftonline.com/<ENTRA_TENANT_ID>',
    redirectUri: '<https://techhub-host.example/>',
    postLogoutRedirectUri: '<https://techhub-host.example/>',
    apiScopes: ['<api://TECHHUB_API_APP_ID/access_as_user>']
  },

  // Public application address, used for QR codes and shared links.
  appBaseUrl: '<https://techhub-host.example/>',

  // External links that are hard-coded in the prototype today.
  links: {
    scoreLibraryBase: '<https://score-library-host.example/library/>',  // documents-master.js TAQA_DOC.scoreUrl
    vivaEngageCommunity: '<VIVA_ENGAGE_GROUP_URL>'                      // index.html hero link
  },

  // Prototype-only behaviour. Every flag must be false in UAT and PROD.
  features: {
    roleSwitcher: false,          // the "View as" door: preview only, never in production
    localRegisterFallback: false, // TAQA_STORE writing to localStorage instead of the API
    demoFixtures: false           // sample contributors, activity and names in dashboard.html
  },

  logging: {
    level: '<error | warn | info>',
    clientErrorEndpoint: '<OPTIONAL_TELEMETRY_ENDPOINT>'
  }
};
