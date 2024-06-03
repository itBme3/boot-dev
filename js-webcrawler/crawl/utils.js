import { JSDOM } from "jsdom";
import process from "node:process";

const MAX_PAGES = 200;

/**
 * @param {string} url
 * @returns {string}
 */
function normalizeURL(url) {
  return url
    ?.replace(/^https?:\/\/(www\.)?/, "")
    .replace("/?", "?")
    .replace(/\/$/, "");
}

/**
 * @param {string} html
 * @returns {string[]}
 * @returns {string}
 */
function getURLsFromHTML(html, baseUrl) {
  const { document } = new JSDOM(html).window;
  /** @type {string[]} */
  const urls = [];

  document.querySelectorAll("a").forEach((elem) => {
    const url = elem.getAttribute("href");
    const normalizedUrl = normalizeURL(
      url?.startsWith("/") ? `${baseUrl}${url}` : url
    );
    if (url && normalizedUrl.startsWith(normalizeURL(baseUrl))) {
      urls.push(url);
    }
  });
  return urls;
}

/**
 * @param {string} baseUrl
 * @param {string} currentUrl
 * @param {Record<string, number>} crawled
 */
async function crawlPage(baseUrl, currentUrl = baseUrl, crawled = {}) {
  if (Object.keys(crawled).length >= MAX_PAGES) {
    return crawled;
  }
  const normalizedBase = normalizeURL(baseUrl);
  let basePath = normalizedBase.split("/").slice(1).join("/");
  if (basePath) {
    basePath = `/${basePath}`;
    if (currentUrl?.startsWith("/") && !currentUrl.startsWith(basePath)) {
      console.log(basePath, currentUrl);
      return crawled;
    }
  }
  let normalizedCurrent = normalizeURL(
    `${
      currentUrl?.startsWith("/")
        ? `${normalizedBase.replace(basePath, "")}`
        : ""
    }${currentUrl}`
  );
  if (!normalizedCurrent?.startsWith(normalizedBase)) {
    return crawled;
  }
  if (crawled[normalizedCurrent]) {
    crawled[normalizedCurrent]++;
    return crawled;
  }

  crawled[normalizedCurrent] = 1;

  console.log(`fetching url: ${normalizedCurrent}`);
  /** @type {Response} */
  let page;

  try {
    page = await fetch(`https://${normalizedCurrent}`);
    if (page.status.toString().startsWith("4")) {
      console.error(
        `failed to fetch w/ status: ${page.status} (url: ${normalizedCurrent})`
      );
      if (normalizedBase === normalizedCurrent) {
        process.exit(1);
      }
      return crawled;
    }

    const contentType = page.headers.get("content-type");

    if (!contentType.includes("text/html")) {
      console.error(
        `ERROR: expecting content-type: text/html — received: ${contentType}`
      );
      if (normalizedBase === normalizedCurrent) {
        process.exit(1);
      }
    }
    const html = await page.text();
    const urls = await getURLsFromHTML(html, baseUrl);

    for await (const url of urls) {
      const currentCrawl = await crawlPage(baseUrl, url, crawled);
      crawled = {
        ...crawled,
        ...currentCrawl,
      };
    }
    return crawled;
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

/**
 * @param {Record<string, number>} crawled
 */
function sortResults(report) {
  const entries = [...Object.entries(report)];
  return entries.sort(([_a, a], [_b, b]) => b - a);
}

/**
 * @param {Record<string, number>} crawled
 */
function printReport(report) {
  const sortedReport = sortResults(report);
  console.log("==========================================================");
  for (const [url, count] of sortedReport) {
    if (url === "print") {
      continue;
    }
    console.log(`Found ${count} internal links to https://${url}`);
  }
}

export { normalizeURL, getURLsFromHTML, crawlPage as page, printReport };
