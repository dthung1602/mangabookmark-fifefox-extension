const ENV = "staging";
const ENV_BASE_URL_MAPPING = {
  dev: "http://localhost:3000",
  staging: "https://dev-manga-bookmark.herokuapp.com",
  production: "https://mangabookmark.herokuapp.com"
}
const BASE_URL = ENV_BASE_URL_MAPPING[ENV];
const WAIT_TIME_BEFORE_MARKING_CHAPTER_IN_SEC = 1;
const POLL_LOCATION_WAIT_TIME_IN_SEC = 10;
const VERBOSE = ENV !== "production";

/**
 * Marking chapter logic
 */

async function markChapter(mangaId, chapterLink) {
  console.log("Start auto marking chapter as read");

  const body = {
    "isRead": true,
    "chapters": [
      chapterLink,
    ]
  };

  const response = await fetch(`${BASE_URL}/api/mangas/${mangaId}/mark-chapters`, {
    mode: "cors",
    credentials: "include",
    cache: "no-cache",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (VERBOSE) {
    console.log("Response:");
    console.log(response);
  }

  const responseBody = await response.json();

  if (VERBOSE) {
    console.log("Response body:");
    console.log(responseBody);
  }

  console.log("Marked successfully")
}

async function getManga(chapterLink) {
  // TODO add cache to avoid making API call
  console.log(`Finding manga id of ${chapterLink}`);

  const params = new URLSearchParams({ "chapters.link": chapterLink });
  const url = `${BASE_URL}/api/mangas?${params}`;

  const response = await fetch(url);

  if (VERBOSE) {
    console.log("Response:");
    console.log(response);
  }

  const body = await response.json();

  if (VERBOSE) {
    console.log("Response body:");
    console.log(body);
  }

  if (body.data.length === 0) {
    throw Error(`Cannot find manga with chapter ${chapterLink}`)
  }

  const manga = body.data[0];
  console.log(`Found manga with id: ${manga._id}`);

  return manga;
}

function isChapterRead(manga, chapterLink) {
  return manga.chapters.find(ch => ch.link === chapterLink).isRead
}

/**
 * Scheduling mark chapter logic
 */

function main(chapterLink) {
  setTimeout(async function () {
    // TODO ? Skip marking because user doesn't stay on page long enough ?
    try {
      const manga = await getManga(chapterLink);
      if (isChapterRead(manga, chapterLink)) {
        console.log(`Chapter already marked as read`);
        return;
      }
      await markChapter(manga._id, chapterLink);
    } catch (e) {
      console.error(e);
    }
  }, WAIT_TIME_BEFORE_MARKING_CHAPTER_IN_SEC * 1000);
}

// For first page load & traditional pages
main(window.location.href.toString());

// For SPA navigation
let lastLocation = window.location.href.toString();

function checkIfUserNavigated() {
  if (VERBOSE) {
    console.log("Check if user navigated");
  }
  const currentLocation = window.location.href.toString();
  if (lastLocation !== currentLocation) {
    if (VERBOSE) {
      console.log("User navigated");
    }
    main(currentLocation);
    lastLocation = currentLocation;
  }
}

setInterval(checkIfUserNavigated, POLL_LOCATION_WAIT_TIME_IN_SEC * 1000);
