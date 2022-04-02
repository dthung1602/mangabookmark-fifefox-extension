const ENV = "production";
const ENV_BASE_URL_MAPPING = {
  dev: "http://localhost:3000",
  staging: "https://dev-manga-bookmark.herokuapp.com",
  production: "https://mangabookmark.herokuapp.com"
}
const BASE_URL = ENV_BASE_URL_MAPPING[ENV];
const WAITING_TIME_IN_SECS = 1;

async function main() {
  try {
    const manga = await getManga();
    if (isChapterRead(manga)) {
      console.log(`Chapter already marked as read`);
      return;
    }
    await markChapter(manga._id);
  } catch (e) {
    console.error(e);
  }
}

async function markChapter(mangaId) {
    console.log("Start auto marking chapter as read");

    const body = {
      "isRead": true,
      "chapters": [
        window.location.toString(),
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

    await response.json();

    console.log("Marked successfully")
}

async function getManga() {
  console.log(`Finding manga id of ${window.location}`);

  const params = new URLSearchParams({"chapters.link": window.location.toString()});
  const url = `${BASE_URL}/api/mangas?${params}`;

  const response = await fetch(url);
  const body = await response.json();

  if (body.data.length === 0) {
    throw Error(`Cannot find manga with chapter ${window.location}`)
  }

  const manga = body.data[0];
  console.log(`Found manga with id: ${manga._id}`);

  return manga;
}

function isChapterRead(manga) {
  const link = window.location.toString();
  return manga.chapters.find(ch => ch.link === link).isRead
}

setTimeout(main, WAITING_TIME_IN_SECS * 1000);

// TODO handle SPA navigation
