/* Digini homepage — live Selldone catalog with an editorial technology shell. */

import { loadCatalog } from "./shop-data.js";
import { cardHTML, esc } from "./app.js";

const CATEGORY_ART = {
  108594: "laptop.png",
  108595: "microphones.png",
  108596: "tvs.png",
  108597: "headphones.png",
  108598: "digital-cameras.png",
  108599: "power-banks.png",
  108600: "earbuds.png",
  108601: "flash-drives.png",
  108602: "hard-drives.png",
  108603: "monitors.png",
  108604: "printers.png",
  108605: "keyboards.png",
  108606: "mice.png",
  108607: "action-cameras.png",
  108608: "rv-power-stations.png",
};

const CAMPAIGNS = [
  {
    image: "assets/campaigns/performance-desk.png",
    alt: "Modern performance desk with a laptop and monitor",
    kicker: "Work smarter",
    title: "Build your best setup.",
    titleLines: ["Build your", "best setup."],
    lede: "Powerful everyday technology, selected to work beautifully together.",
    label: "Shop computers",
    href: "shop.html?cat=laptop",
  },
  {
    image: "assets/campaigns/creator-essentials.png",
    alt: "Professional camera and audio tools for creators",
    kicker: "Create with clarity",
    title: "Make every idea sound and look better.",
    titleLines: ["Make every idea", "sound and look better."],
    lede: "Cameras, microphones, and audio essentials for your next project.",
    label: "Shop creator gear",
    href: "shop.html?cat=digital-camera",
  },
  {
    image: "assets/campaigns/portable-power.png",
    alt: "Portable power equipment in an outdoor setting",
    kicker: "Ready anywhere",
    title: "Dependable power that travels.",
    titleLines: ["Dependable power", "that travels."],
    lede: "Stay connected on the road, at camp, or when the lights go out.",
    label: "Shop portable power",
    href: "shop.html?cat=rv",
  },
];

function initCampaigns() {
  const image = document.querySelector("[data-hero-img]");
  const kicker = document.querySelector("[data-campaign-kicker]");
  const title = document.querySelector("[data-campaign-title]");
  const lede = document.querySelector("[data-campaign-lede]");
  const link = document.querySelector("[data-hero-link]");
  const dots = document.querySelector("[data-campaign-dots]");
  if (!image || !dots) return;

  let active = 0;
  let timer;
  const paint = (index, restart = true) => {
    active = (index + CAMPAIGNS.length) % CAMPAIGNS.length;
    const item = CAMPAIGNS[active];
    image.src = item.image;
    image.alt = item.alt;
    kicker.textContent = item.kicker;
    title.innerHTML = item.titleLines.map((line) => `<span>${esc(line)}</span>`).join("");
    lede.textContent = item.lede;
    link.textContent = item.label;
    link.href = item.href;
    dots.querySelectorAll("button").forEach((button, i) => {
      button.setAttribute("aria-current", i === active ? "true" : "false");
    });
    if (restart) {
      clearInterval(timer);
      timer = setInterval(() => paint(active + 1, false), 6500);
    }
  };

  dots.innerHTML = CAMPAIGNS.map((item, i) =>
    `<button type="button" aria-label="Show ${esc(item.kicker)} campaign" aria-current="${i === 0}"></button>`,
  ).join("");
  dots.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) paint([...dots.children].indexOf(button));
  });
  paint(0);
}

function fillHome(catalog) {
  const ids = new Map((catalog.cfg.categories || []).map((item) => [item.slug, item.id]));
  const grid = document.getElementById("catgrid");
  const categorySection = grid?.closest("section");
  if (categorySection) categorySection.hidden = catalog.cats.length === 0;
  if (grid) {
    const featuredCategories = catalog.cats.slice(0, 6);
    grid.dataset.n = String(featuredCategories.length);
    grid.innerHTML = featuredCategories.map((category) => {
      const art = CATEGORY_ART[ids.get(category.slug)];
      return `<a class="cat digini-cat" href="shop.html?cat=${encodeURIComponent(category.slug)}">
        <span class="digini-cat__art"><img src="${art ? `assets/categories/${art}` : category.image}" alt="${esc(category.name)}" loading="lazy" width="500" height="500"></span>
        <span class="digini-cat__copy"><b>${esc(category.name)}</b><small>${category.count} products</small></span>
      </a>`;
    }).join("");
  }

  document.querySelectorAll("[data-all-refs]").forEach((link) => {
    link.textContent = `All ${catalog.products.length} products →`;
  });

  const arrivals = document.getElementById("arrivals");
  if (arrivals) {
    const newest = [...catalog.products]
      .sort((a, b) => String(b.raw.created_at || "").localeCompare(String(a.raw.created_at || "")) || b.id - a.id)
      .slice(0, 10);
    arrivals.innerHTML = newest.map(cardHTML).join("");
  }

  const categories = catalog.cats.length;
  document.querySelectorAll("[data-category-count]").forEach((el) => { el.textContent = categories; });
}

initCampaigns();

loadCatalog()
  .then(fillHome)
  .catch((error) => {
    console.error(error);
    const message = document.querySelector("[data-catalog-error]");
    if (message) {
      message.hidden = false;
      message.textContent = "The live catalog could not be loaded. Please try again shortly.";
    }
  });
