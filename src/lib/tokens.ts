import { customAlphabet } from 'nanoid';

// URL-safe alphabet, no ambiguous characters (no 0/O, 1/l/I).
const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 20 chars at this alphabet size = ~116 bits of entropy. Unguessable, and
// short enough to leave real headroom under the POS limit below.
const TOKEN_LENGTH = 20;
const generate = customAlphabet(alphabet, TOKEN_LENGTH);

export function generateRevealToken(): string {
  return generate();
}

/**
 * Hard ceiling on a reveal URL.
 *
 * The POS stores delivered codes in product_access_codes.access_code, a
 * varchar(64). MySQL is not in strict mode there, so an over-length value
 * is silently truncated rather than rejected: verified 2026-08-18, when a
 * 71-character URL was cut to 64 with no error, sold, and printed on a
 * receipt looking entirely valid. A truncated URL 404s for the student.
 *
 * Never emit a URL we cannot prove fits.
 */
export const POS_ACCESS_CODE_MAX_LENGTH = 64;

export function buildRevealUrl(appUrl: string, token: string): string {
  const url = `${appUrl.replace(/\/+$/, '')}/r/${token}`;
  if (url.length > POS_ACCESS_CODE_MAX_LENGTH) {
    throw new Error(
      `Reveal URL is ${url.length} characters, over the ${POS_ACCESS_CODE_MAX_LENGTH}-character POS limit. ` +
        `The POS would truncate it silently and the link would break. ` +
        `Shorten NEXT_PUBLIC_APP_URL (currently "${appUrl}") or the token length.`,
    );
  }
  return url;
}
