const apiBase = "./api";
const hero = document.querySelector(".hero");
const finder = document.querySelector("#finder");
const resultsSection = document.querySelector("#results");
const cards = document.querySelector("#cards");
const template = document.querySelector("#card-template");
const countrySelect = document.querySelector("#country");
const platformList = document.querySelector("#platform-list");
const locationText = document.querySelector("#location-text");
const status = document.querySelector("#results-status");
const title = document.querySelector("#results-title");
const modeLabel = document.querySelector("#mode-label");
const button = finder.querySelector("button[type='submit']");
const editButton = document.querySelector("#edit-preferences");

const fallbackCountries = [
  { code: "IN", name: "India" }, { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" }, { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" }, { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }, { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" }, { code: "BR", name: "Brazil" }
];
const fallbackProviders = {
  IN: ["Netflix", "Prime Video", "JioHotstar", "Sony LIV", "ZEE5", "Apple TV", "YouTube", "Discovery+"],
  US: ["Netflix", "Prime Video", "Disney Plus", "Hulu", "Max", "Peacock", "Paramount Plus", "Apple TV", "YouTube"],
  GB: ["Netflix", "Prime Video", "Disney Plus", "NOW", "ITVX", "BBC iPlayer", "Apple TV", "YouTube"],
  CA: ["Netflix", "Prime Video", "Disney Plus", "Crave", "CBC Gem", "Apple TV", "YouTube"],
  AU: ["Netflix", "Prime Video", "Disney Plus", "Stan", "BINGE", "ABC iview", "Apple TV", "YouTube"],
  SG: ["Netflix", "Prime Video", "Disney Plus", "Viu", "meWATCH", "Apple TV", "YouTube"],
  AE: ["Netflix", "Prime Video", "Disney Plus", "Shahid VIP", "STARZPLAY", "Apple TV", "YouTube"],
  DE: ["Netflix", "Prime Video", "Disney Plus", "WOW", "Joyn", "RTL+", "Apple TV", "YouTube"],
  FR: ["Netflix", "Prime Video", "Disney Plus", "Max", "Canal+", "france.tv", "Apple TV", "YouTube"],
  JP: ["Netflix", "Prime Video", "Disney Plus", "U-NEXT", "Hulu", "ABEMA", "Apple TV", "YouTube"],
  KR: ["Netflix", "Disney Plus", "TVING", "Wavve", "Watcha", "Coupang Play", "Apple TV", "YouTube"],
  BR: ["Netflix", "Prime Video", "Disney Plus", "Globoplay", "Max", "Apple TV", "YouTube"]
};
const fallbackTitles = [
  { title: "Dune: Part Two", type: "Movie", year: "2024", genre: "Science Fiction", tone: ["epic", "thoughtful", "action", "sci-fi"], trailerId: "Way9Dexny3w", blurb: "Power, prophecy and enormous scale for a night when you want to disappear into another world.", providers: { US: ["Max", "Prime Video"], IN: ["JioHotstar"], GB: ["NOW"] } },
  { title: "Fallout", type: "Series", year: "2024", genre: "Adventure", tone: ["dark comedy", "action", "sci-fi", "quirky"], trailerId: "V-mugKDQDlg", blurb: "A bright-eyed vault dweller meets a cheerfully brutal wasteland in a sharp genre adventure.", providers: { US: ["Prime Video"], IN: ["Prime Video"], GB: ["Prime Video"] } },
  { title: "Stranger Things", type: "Series", year: "2016", genre: "Mystery", tone: ["nostalgic", "thrilling", "friendship", "mystery"], trailerId: "b9EkMc79ZSU", blurb: "A warm, suspenseful group adventure with monsters, synths and fiercely loyal friends.", providers: { US: ["Netflix"], IN: ["Netflix"], GB: ["Netflix"] } },
  { title: "RRR", type: "Movie", year: "2022", genre: "Action Drama", tone: ["spectacle", "friendship", "action", "uplifting"], trailerId: "NgBoMJy386M", blurb: "An unapologetically maximal action friendship saga built for an energetic movie night.", providers: { US: ["Netflix"], IN: ["Netflix", "ZEE5"], GB: ["Netflix"] } },
  { title: "Interstellar", type: "Movie", year: "2014", genre: "Science Fiction", tone: ["emotional", "thoughtful", "sci-fi", "epic"], trailerId: "zSWdZVtXT7E", blurb: "A soaring, emotional space odyssey for viewers who want ideas and heart in equal measure.", providers: { US: ["Prime Video"], IN: ["Prime Video"], GB: ["Paramount+"] } },
  { title: "Wednesday", type: "Series", year: "2022", genre: "Mystery Comedy", tone: ["quirky", "mystery", "funny", "dark comedy"], trailerId: "Di310WS8zLk", blurb: "Deadpan wit, school secrets and supernatural twists in a beautifully odd binge.", providers: { US: ["Netflix"], IN: ["Netflix"], GB: ["Netflix"] } }
];

let config = { live: false, countries: fallbackCountries };
let serverAvailable = true;

init();

async function init() {
  let location = { country: "IN", name: "India", detected: false };
  try {
    const [configResponse, locationResponse] = await Promise.all([
      fetch(`${apiBase}/config.php`),
      fetch(`${apiBase}/location.php`)
    ]);
    ensureJson(configResponse);
    ensureJson(locationResponse);
    config = await configResponse.json();
    location = await locationResponse.json();
    modeLabel.textContent = config.live ? "Live availability" : "Showcase mode";
  } catch {
    serverAvailable = false;
    modeLabel.textContent = "Static preview";
  }
  setCountries(location);
  await loadPlatforms(location.country);
}

countrySelect.addEventListener("change", async () => {
  const selected = config.countries.find((country) => country.code === countrySelect.value);
  locationText.textContent = selected?.name || "Selected country";
  await loadPlatforms(countrySelect.value);
});

finder.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitPreferences();
});

editButton.addEventListener("click", () => {
  resultsSection.hidden = true;
  hero.hidden = false;
  document.body.classList.remove("browse-active");
  hero.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function loadPlatforms(country) {
  const previouslySelected = new Set(selectedPlatforms());
  let providers = fallbackProviders[country] || fallbackProviders.IN;
  if (serverAvailable) {
    try {
      const response = await fetch(`${apiBase}/providers.php?country=${encodeURIComponent(country)}`);
      ensureJson(response);
      const data = await response.json();
      providers = data.providers;
    } catch {
      providers = fallbackProviders[country] || fallbackProviders.IN;
    }
  }
  platformList.replaceChildren();
  providers.forEach((provider, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = provider;
    input.checked = previouslySelected.size ? previouslySelected.has(provider) : index < 3;
    const name = document.createElement("span");
    name.textContent = provider;
    label.append(input, name);
    platformList.append(label);
  });
}

async function submitPreferences() {
  button.disabled = true;
  const original = button.querySelector("span").textContent;
  button.querySelector("span").textContent = "Curating your list...";
  const preferences = {
    country: countrySelect.value,
    type: finder.elements.type.value,
    mood: finder.elements.mood.value,
    time: finder.elements.time.value,
    interests: finder.elements.interests.value,
    platforms: selectedPlatforms()
  };
  try {
    const data = serverAvailable ? await serverRecommendations(preferences) : fallbackRecommendations(preferences);
    renderRails(data.results);
    const country = config.countries.find((item) => item.code === countrySelect.value)?.name || "your country";
    title.textContent = `Because you're watching in ${country}`;
    status.textContent = !data.results.length
      ? "No titles match those selected services. Choose more services or widen your preferences."
      : data.mode === "live"
      ? resultSummary(data.results, country)
      : data.notice
      ? data.notice
      : serverAvailable
      ? "Preview catalog shown. Add API keys for current regional availability."
      : "Static preview shown. PHP hosting activates live regional availability.";
    hero.hidden = true;
    resultsSection.hidden = false;
    document.body.classList.add("browse-active");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = error.message || "Recommendations could not be loaded right now.";
    resultsSection.hidden = false;
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = original;
  }
}

function setCountries(location) {
  countrySelect.replaceChildren();
  for (const country of config.countries) {
    countrySelect.add(new Option(country.name, country.code));
  }
  countrySelect.value = location.country;
  locationText.textContent = location.detected ? location.name : `${location.name} (select region)`;
}

function selectedPlatforms() {
  return [...platformList.querySelectorAll("input:checked")].map((input) => input.value);
}

function ensureJson(response) {
  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.toLowerCase().includes("application/json")) {
    throw new Error("PHP endpoints are not being executed by this server.");
  }
}

async function serverRecommendations(preferences) {
  const response = await fetch(`${apiBase}/recommendations.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences)
  });
  ensureJson(response);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

function fallbackRecommendations(preferences) {
  const keywords = `${preferences.mood} ${preferences.interests}`.toLowerCase();
  const results = fallbackTitles
    .filter((item) => preferences.type === "any" || (preferences.type === "movie" ? item.type === "Movie" : item.type === "Series"))
    .map((item) => {
      const providers = item.providers[preferences.country] || item.providers.US || [];
      const rank = item.tone.reduce((score, word) => score + (keywords.includes(word) ? 2 : 0), 0);
      return { item, providers, rank };
    })
    .filter(({ providers }) => !preferences.platforms.length || matchesPlatforms(providers, preferences.platforms))
    .sort((left, right) => right.rank - left.rank)
    .map(({ item, providers }) => ({ ...item, providers, availability: "preview", availabilityLabel: "Preview catalog", watchLinks: providers.map((provider) => platformLink(provider, item.title)), providerLink: null }));
  return { mode: "showcase", country: preferences.country, results };
}

function resultSummary(results, country) {
  const verified = results.filter((item) => item.availability === "verified").length;
  const regional = results.filter((item) => item.availability === "regional").length;
  const discovery = results.filter((item) => item.availability === "discovery").length;
  const parts = [];
  if (verified) parts.push(`${verified} verified on your selected services`);
  if (regional) parts.push(`${regional} available in ${country}`);
  if (discovery) parts.push(`${discovery} discovery picks with trailers`);
  return parts.join(", ") + ".";
}

function matchesPlatforms(providers, wanted) {
  return providers.some((provider) =>
    wanted.some((choice) => provider.toLowerCase().includes(choice.toLowerCase()) || choice.toLowerCase().includes(provider.toLowerCase()))
  );
}

function platformLink(provider, itemTitle) {
  const query = encodeURIComponent(itemTitle);
  const normalized = provider.toLowerCase();
  let url = `https://www.google.com/search?q=${query}+watch+on+${encodeURIComponent(provider)}`;
  if (normalized.includes("netflix")) url = `https://www.netflix.com/search?q=${query}`;
  if (normalized.includes("prime")) url = `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`;
  if (normalized.includes("hotstar")) url = `https://www.hotstar.com/in/search?q=${query}`;
  if (normalized.includes("youtube")) url = `https://www.youtube.com/results?search_query=${query}`;
  if (normalized.includes("max")) url = `https://www.max.com/search?q=${query}`;
  return { provider, url };
}

function renderRails(results) {
  cards.replaceChildren();
  const grouped = results.reduce((shelves, result) => {
    const genre = shelfName(result.genre || result.type);
    if (!shelves.has(genre)) shelves.set(genre, []);
    shelves.get(genre).push(result);
    return shelves;
  }, new Map());
  for (const [genre, titles] of grouped) {
    const shelf = document.createElement("section");
    shelf.className = "shelf";
    const heading = document.createElement("h3");
    heading.textContent = genre;
    const track = document.createElement("div");
    track.className = "tile-track";
    titles.forEach((result) => track.append(createTile(result)));
    shelf.append(heading, track);
    cards.append(shelf);
  }
}

function shelfName(genre) {
  if (genre.includes("Science") || genre.includes("Fantasy")) return "Sci-Fi & Fantasy";
  if (genre.includes("Mystery") || genre.includes("Crime")) return "Mystery & Crime";
  if (genre.includes("Action") || genre.includes("Adventure")) return "Action & Adventure";
  return genre;
}

function createTile(result) {
  const card = template.content.firstElementChild.cloneNode(true);
  const iframe = card.querySelector("iframe");
  const trailer = card.querySelector(".trailer-frame");
  if (result.trailerId) {
    iframe.title = `${result.title} official trailer`;
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(result.trailerId)}?rel=0`;
  } else {
    iframe.remove();
    trailer.classList.add("empty");
  }
  card.querySelector(".kind").textContent = result.type;
  card.querySelector(".year").textContent = result.year || "New pick";
  const score = card.querySelector(".score");
  if (result.score) score.textContent = `${result.score} TMDB`;
  else score.remove();
  card.querySelector("h3").textContent = result.title;
  const label = result.availabilityLabel ? `${result.availabilityLabel}. ` : "";
  card.querySelector(".why").textContent = `${label}${result.blurb || result.overview || "A match for your viewing mood."}`;
  const providers = card.querySelector(".provider-links");
  for (const watch of result.watchLinks || []) {
    const link = document.createElement("a");
    link.href = watch.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = watch.provider;
    providers.append(link);
  }
  const options = card.querySelector(".all-options");
  if (result.providerLink) options.href = result.providerLink;
  else options.classList.add("hidden");
  return card;
}
