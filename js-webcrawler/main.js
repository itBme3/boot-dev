import * as process from "node:process";
import { crawl } from "./crawl/index.js";

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("ERROR: You must provide a base url `npm start BASE_URL`");
    process.exit(1);
  }

  if (process.argv[3]) {
    console.error(
      `ERROR: received ${process.argv.length - 2} arguments — expected: 1`
    );
    process.exit(1);
  }

  const result = await crawl.page(url);
  crawl.printReport(result);
}

main();
