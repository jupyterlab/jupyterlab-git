const assert = require('assert');
const puppeteer = require('puppeteer');
const inspect = require('util').inspect;

function getUrl() {
  return process.argv[2];
}

function testJupyterLabPage(html) {
  if (inspect(html).indexOf('jupyter-config-data') === -1) {
    console.error('Error loading JupyterLab page:');
    console.error(html);
  }
}

async function testApplication(page) {
  const el = await page.waitForSelector('#browserTest', { timeout: 100000 });
  console.log('Waiting for application to start...');

  await page.waitForSelector('.completed');

  const textContent = await el.getProperty('textContent');
  const errors = JSON.parse(await textContent.jsonValue());

  for (let error of errors) {
    console.error(`Parsed an error from text content: ${error.message}`, error);
    throw error;
  }
}

function testGitExtension(html) {
    // Test git icons are present
    assert(html.includes('--jp-icon-git-clone'), 'Could not find git clone icon.');
    assert(html.includes('--jp-icon-git-pull'), 'Could not find git pull icon.');
    assert(html.includes('--jp-icon-git-push'), 'Could not find git push icon.');
}

async function main() {
  console.info('Starting Chrome Headless');

  const URL = getUrl();
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.info('Navigating to page:', URL);
  await page.goto(URL);
  console.info('Waiting for page to load...');

  const html = await page.content();
  testJupyterLabPage(html);

  await testApplication(page);
  testGitExtension(html);

  await browser.close();
  console.info('Chrome test complete');
}

// Stop the process if an error is raised in the async function.
process.on('unhandledRejection', up => {
  throw up;
});

main();