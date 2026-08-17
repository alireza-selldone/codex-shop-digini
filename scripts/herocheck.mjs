/* Verify the responsive Digini campaign hero against its current design rules. */
import { chromium } from "playwright";

const BASE = (process.argv[2] || "http://localhost:8788").replace(/\/+$/, "");
const browser = await chromium.launch();
let failures = 0;
const fail = (message) => { failures++; console.log(`  FAIL  ${message}`); };
const pass = (message) => console.log(`  ok    ${message}`);

for (const [width, height] of [[1440, 900], [1024, 900], [820, 1000], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const image = document.querySelector("[data-hero-img]");
    return image?.complete && image.naturalWidth > 0;
  });
  await page.waitForTimeout(300);

  const state = await page.evaluate(() => {
    const hero = document.querySelector(".campaign-hero");
    const image = document.querySelector("[data-hero-img]");
    const copy = document.querySelector(".campaign-hero__copy");
    const heading = copy.querySelector("h1");
    const hr = hero.getBoundingClientRect();
    const ir = image.getBoundingClientRect();
    const cr = copy.getBoundingClientRect();
    const tr = heading.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - innerWidth,
      hero: { top: hr.top, bottom: hr.bottom, width: hr.width },
      image: { top: ir.top, bottom: ir.bottom, width: ir.width, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight },
      copy: { top: cr.top, bottom: cr.bottom, width: cr.width },
      heading: { top: tr.top, bottom: tr.bottom, text: heading.textContent.trim() },
      fit: getComputedStyle(image).objectFit,
    };
  });

  console.log(`\n  ${width}px`);
  state.overflow === 0 ? pass("no horizontal overflow") : fail(`${state.overflow}px horizontal overflow`);
  state.fit === "cover" ? pass("campaign image uses object-fit: cover") : fail(`unexpected object-fit: ${state.fit}`);
  state.image.naturalWidth > state.image.naturalHeight ? pass("landscape campaign artwork loaded") : fail("campaign artwork is not landscape");
  const copyVisible = state.heading.top >= state.hero.top && state.heading.bottom <= state.hero.bottom && state.heading.text.length > 10;
  copyVisible ? pass("campaign heading is fully visible") : fail("campaign heading is clipped or empty");
  if (width <= 820) {
    Math.round(state.image.bottom - state.image.top) === 280 ? pass("mobile image zone is 280px") : fail("mobile image zone changed");
    state.copy.top >= state.image.bottom ? pass("mobile copy follows the image without overlap") : fail("mobile copy overlaps the image");
  } else {
    state.copy.width < state.hero.width * .55 ? pass("desktop copy leaves the product scene visible") : fail("desktop copy obscures too much artwork");
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)\n` : "\nHero checks passed.\n");
process.exit(failures ? 1 : 0);
