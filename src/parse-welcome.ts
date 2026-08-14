import { WelcomeInfo } from "./types";

/**
 * Parses the club's TNClub.htm news/conditions document — Word-exported HTML
 * uploaded by club staff — into a title plus clean text paragraphs.
 *
 * Word HTML is extremely noisy (mso styles, xml islands, conditional
 * comments, hard line wraps mid-sentence). Strategy: isolate the body, strip
 * the noise, split on Word's paragraph blocks, and reduce each paragraph to
 * escaped text with only vetted hyperlinks preserved. Output paragraphs are
 * safe to inject as innerHTML by construction.
 */
export function parseClubNews(html: string, fetchedAt: string): WelcomeInfo {
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  let body = bodyMatch ? bodyMatch[1] : html;

  body = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|xml|head|title)\b[\s\S]*?<\/\1>/gi, " ");

  const paragraphs: string[] = [];
  for (const m of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const rendered = renderParagraph(m[1]);
    if (rendered) paragraphs.push(rendered);
  }

  const merged = mergeContinuations(paragraphs).filter((p) => !isIrrelevant(p));
  const title = merged.length > 0 ? stripTags(merged[0]) : "";
  return { title, paragraphs: merged.slice(1), fetchedAt };
}

/**
 * Drops paragraphs that only make sense on the club's own website — e.g.
 * instructions for clearing the Edge browser cache.
 */
function isIrrelevant(paragraph: string): boolean {
  return /browser\s+cache/i.test(stripTags(paragraph));
}

/**
 * Word stores manual line-wraps as separate paragraphs, splitting sentences
 * mid-stream ("...prior to EACH" / "lesson or clinic..."). Merge a paragraph
 * into the previous one when the previous doesn't end a sentence and this one
 * continues it (starts with a lowercase letter, digit, or open paren).
 */
function mergeContinuations(paragraphs: string[]): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    const prev = out[out.length - 1];
    if (prev !== undefined && !/[.!?:]$/.test(stripTags(prev)) && /^[a-z0-9(]/.test(stripTags(p))) {
      out[out.length - 1] = tidyPunctuation(`${prev} ${p}`);
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Removes stray whitespace around punctuation left by tag stripping. */
function tidyPunctuation(html: string): string {
  return html
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}

/** Reduces one Word paragraph to escaped text + vetted anchor links. */
function renderParagraph(fragment: string): string {
  // Preserve hyperlinks via placeholders before stripping all other markup.
  const links: { href: string; text: string }[] = [];
  const withPlaceholders = fragment.replace(
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi,
    (_all, dq, sq, inner) => {
      const href = decodeEntities(String(dq ?? sq ?? "").trim());
      const text = plainText(inner);
      if (!/^(https?:|mailto:)/i.test(href) || !text) return ` ${text} `;
      links.push({ href, text });
      return ` LINKTOKEN${links.length - 1}X `;
    },
  );

  const text = plainText(withPlaceholders);
  if (!text) return "";

  const escaped = escapeHtml(text);
  const withLinks = escaped.replace(/LINKTOKEN(\d+)X/g, (_all, idx) => {
    const link = links[parseInt(idx, 10)];
    if (!link) return "";
    return `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.text)}</a>`;
  });
  return withLinks.replace(/\s+/g, " ").trim();
}

function plainText(fragment: string): string {
  // Line-break-ish tags become spaces; all other tags are stripped WITHOUT
  // adding whitespace — Word splits single words across adjacent styled spans
  // ("B</span><span>ALL"), and a space there breaks the word. Genuine word
  // boundaries survive as real whitespace in the text nodes.
  const separated = fragment.replace(/<br\b[^>]*>/gi, " ");
  return decodeEntities(separated.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#(\d+);/g, (_all: string, code: string) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/gi, "&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}
