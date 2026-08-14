import { CHELSEA_BASE_URL } from "./chelsea";
import { WelcomeInfo, WelcomeSlide } from "./types";

/**
 * Parses the welcome page (TNwelcome2.aspx) into the club's editable message
 * block and the announcement image slider.
 *
 * Deliberately lenient: the club controls this content and sections may be
 * absent, so missing pieces yield empty values rather than errors. (A login
 * bounce is already caught upstream by the scraper as SESSION_REJECTED.)
 */
export function parseWelcome(html: string, fetchedAt: string): WelcomeInfo {
  // <h1> <span id="lblAddBooking" ...>WELCOME</span></h1>  <p>message</p>
  const headingMatch = /id="lblAddBooking"[^>]*>([\s\S]*?)<\/span>/i.exec(html);
  const heading = headingMatch ? cleanText(headingMatch[1]) : "";

  let message = "";
  if (headingMatch) {
    const after = html.slice(headingMatch.index);
    const paraMatch = /<\/h1>\s*<p>([\s\S]*?)<\/p>/i.exec(after);
    if (paraMatch) message = cleanText(paraMatch[1]);
  }

  // DevExpress image slider config:
  // ...'items':{'0':{'n':'ClubNews','s':'../images/Slides/Club_News.jpg','t':'Club News'}},'itemsCount':1...
  const slides: WelcomeSlide[] = [];
  const itemsMatch = /'items':\{([\s\S]*?)\},'itemsCount'/.exec(html);
  if (itemsMatch) {
    const itemRe = /\{'n':'((?:[^'\\]|\\.)*)','s':'((?:[^'\\]|\\.)*)','t':'((?:[^'\\]|\\.)*)'\}/g;
    for (const m of itemsMatch[1].matchAll(itemRe)) {
      const src = toAbsoluteUrl(unescapeJs(m[2]));
      if (!src) continue;
      slides.push({ name: unescapeJs(m[1]), title: unescapeJs(m[3]), src });
    }
  }

  return { heading, message, slides, fetchedAt };
}

function cleanText(fragment: string): string {
  return fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeJs(value: string): string {
  return value.replace(/\\(['"\\/])/g, "$1");
}

/** Resolves slider paths like "../images/Slides/x.jpg" against the site root; https only. */
function toAbsoluteUrl(path: string): string | null {
  let url: string;
  if (/^https:\/\//i.test(path)) {
    url = path;
  } else if (/^https?:/i.test(path)) {
    return null; // refuse non-https absolute URLs
  } else {
    url = `${CHELSEA_BASE_URL}/${path.replace(/^(\.\.\/)+|^\/+/, "")}`;
  }
  return url;
}
