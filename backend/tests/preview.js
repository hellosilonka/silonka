// Browser QA serves the production build without connecting to a database.
// Playwright intercepts API calls with explicit test fixtures.
process.env.NODE_ENV = 'production';
process.env.APP_URL = 'http://127.0.0.1:4173';
const { createApp } = await import('../app.js');
createApp().listen(4173, '127.0.0.1');
