import { test, expect } from "@jest/globals";
import { crawl } from "./crawl";

// describe("normalizeURL", () => {
for (const prefix of ["https://", "http://", "https://www.", "http://www."]) {
  for (const suffix of [
    "",
    "/",
    "/page",
    "/page/",
    "/page?param=value",
    "/page/?param=value",
  ]) {
    const url = `${prefix}example.com${suffix}`;
    const expected = `example.com${suffix
      .replace("/?", "?")
      .replace(/\/$/, "")}`;
    test(`normalizeURL(${url}) => ${expected}`, () => {
      expect(crawl.normalizeURL(url)).toBe(expected);
    });
  }
}
// });

const urls = [
  "https://example.com",
  "https://example.com/page",
  "/another",
  "http://www.example.com/page?param=value",
];
const html = `<!DOCTYPE html>\
<a href="https://nope.com">Test</a>\
${urls.map((url) => `<a href="${url}">Test</a>`)}`;
test("getURLsFromHTML", () => {
  expect(crawl.getURLsFromHTML(html, "http://example.com")).toEqual(urls);
});
