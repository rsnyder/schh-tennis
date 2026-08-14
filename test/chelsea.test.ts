import { describe, it, expect } from "vitest";
import {
  CookieJar,
  extractHiddenField,
  extractPlaydateOptions,
  extractSelectedPlaydate,
  parseSetCookie,
  playdateOptionToISO,
  type CookieSource,
} from "../src/chelsea";

/** Builds a Response-shaped stub carrying the given Set-Cookie header lines. */
function responseWithSetCookies(values: string[]): CookieSource {
  return {
    headers: {
      getSetCookie: () => values,
      get: (name: string) => (name.toLowerCase() === "set-cookie" ? values.join(", ") : null),
    },
  };
}

/** A stub for runtimes without getSetCookie(), exposing only the joined header. */
function legacyResponse(joined: string): CookieSource {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === "set-cookie" ? joined : null),
    },
  };
}

describe("extractHiddenField", () => {
  it("reads a value that follows the name attribute", () => {
    const html = `<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="/wEPDwUKMTIz+ab/c=" />`;
    expect(extractHiddenField(html, "__VIEWSTATE")).toBe("/wEPDwUKMTIz+ab/c=");
  });

  it("reads a value that precedes the name attribute", () => {
    const html = `<input value="abc+123/=" name="__EVENTVALIDATION" type="hidden" />`;
    expect(extractHiddenField(html, "__EVENTVALIDATION")).toBe("abc+123/=");
  });

  it("tolerates single-quoted and unquoted attributes", () => {
    expect(extractHiddenField(`<input name='__VIEWSTATEGENERATOR' value='CA0B0334'>`, "__VIEWSTATEGENERATOR")).toBe(
      "CA0B0334",
    );
    expect(extractHiddenField(`<input name=__VIEWSTATEGENERATOR value=CA0B0334>`, "__VIEWSTATEGENERATOR")).toBe(
      "CA0B0334",
    );
  });

  it("tolerates extra whitespace and newlines between attributes", () => {
    const html = `<input
        type="hidden"
        name="__VIEWSTATE"
        value="wrapped-value" />`;
    expect(extractHiddenField(html, "__VIEWSTATE")).toBe("wrapped-value");
  });

  it("does not confuse a prefix-matching field name", () => {
    const html = `
      <input type="hidden" name="__VIEWSTATEGENERATOR" value="GEN" />
      <input type="hidden" name="__VIEWSTATE" value="STATE" />
    `;
    expect(extractHiddenField(html, "__VIEWSTATE")).toBe("STATE");
    expect(extractHiddenField(html, "__VIEWSTATEGENERATOR")).toBe("GEN");
  });

  it("returns the first match when a name repeats", () => {
    const html = `<input name="__VIEWSTATE" value="first"><input name="__VIEWSTATE" value="second">`;
    expect(extractHiddenField(html, "__VIEWSTATE")).toBe("first");
  });

  it("decodes HTML entities in the value", () => {
    const html = `<input type="hidden" name="__EVENTVALIDATION" value="a&amp;b&lt;c&quot;d" />`;
    expect(extractHiddenField(html, "__EVENTVALIDATION")).toBe(`a&b<c"d`);
  });

  it("returns an empty string for a present but empty value", () => {
    const html = `<input type="hidden" name="__EVENTTARGET" value="" />`;
    expect(extractHiddenField(html, "__EVENTTARGET")).toBe("");
  });

  it("returns null when the field is missing", () => {
    const html = `<input type="hidden" name="__VIEWSTATE" value="x" />`;
    expect(extractHiddenField(html, "__EVENTVALIDATION")).toBeNull();
  });

  it("returns null for an empty document", () => {
    expect(extractHiddenField("", "__VIEWSTATE")).toBeNull();
  });

  it("ignores a matching name that lives on a non-input element", () => {
    const html = `<meta name="__VIEWSTATE" value="nope"><input name="other" value="x">`;
    expect(extractHiddenField(html, "__VIEWSTATE")).toBeNull();
  });
});

describe("extractSelectedPlaydate", () => {
  it("reads the value when `selected` precedes `value`", () => {
    const html = `<select name="ddlPlaydate" id="ddlPlaydate">
      <option selected="selected" value="August 12, 2026 - Wednesday">August 12, 2026 - Wednesday</option>
      <option value="August 13, 2026 - Thursday">August 13, 2026 - Thursday</option>
    </select>`;
    expect(extractSelectedPlaydate(html)).toBe("August 12, 2026 - Wednesday");
  });

  it("reads the value when `value` precedes `selected`", () => {
    const html = `<option value="August 14, 2026 - Friday" selected>August 14, 2026 - Friday</option>`;
    expect(extractSelectedPlaydate(html)).toBe("August 14, 2026 - Friday");
  });

  it("decodes HTML entities in the option value", () => {
    const html = `<option value="Foo &amp; Bar" selected>Foo &amp; Bar</option>`;
    expect(extractSelectedPlaydate(html)).toBe("Foo & Bar");
  });

  it("returns null when no option is selected", () => {
    const html = `<option value="August 12, 2026 - Wednesday">August 12, 2026 - Wednesday</option>`;
    expect(extractSelectedPlaydate(html)).toBeNull();
  });

  it("returns null for an empty document", () => {
    expect(extractSelectedPlaydate("")).toBeNull();
  });

  it("picks the first selected option when several are present", () => {
    const html = `
      <option value="first" selected>first</option>
      <option value="second" selected>second</option>
    `;
    expect(extractSelectedPlaydate(html)).toBe("first");
  });
});

describe("parseSetCookie", () => {
  it("keeps only the name/value pair before the first semicolon", () => {
    expect(parseSetCookie("ASP.NET_SessionId=abc123; path=/; HttpOnly; SameSite=Lax")).toEqual({
      name: "ASP.NET_SessionId",
      value: "abc123",
    });
  });

  it("preserves '=' characters inside the value", () => {
    expect(parseSetCookie(".ASPXAUTH=AAA=BBB==; path=/")).toEqual({
      name: ".ASPXAUTH",
      value: "AAA=BBB==",
    });
  });

  it("handles a cookie with no attributes", () => {
    expect(parseSetCookie("a=1")).toEqual({ name: "a", value: "1" });
  });

  it("handles an empty value", () => {
    expect(parseSetCookie("a=; expires=Thu, 01 Jan 1970 00:00:00 GMT")).toEqual({
      name: "a",
      value: "",
    });
  });

  it("rejects malformed cookies", () => {
    expect(parseSetCookie("novalue")).toBeNull();
    expect(parseSetCookie("=orphan")).toBeNull();
    expect(parseSetCookie("")).toBeNull();
  });
});

describe("CookieJar", () => {
  it("starts empty and serializes to an empty string", () => {
    const jar = new CookieJar();
    expect(jar.size).toBe(0);
    expect(jar.toHeader()).toBe("");
  });

  it("collects cookies from a response's Set-Cookie array", () => {
    const jar = new CookieJar();
    jar.mergeFromResponse(
      responseWithSetCookies([
        "ASP.NET_SessionId=sess1; path=/; HttpOnly; SameSite=Lax",
        ".ASPXAUTH=auth1; path=/; HttpOnly",
      ]),
    );
    expect(jar.size).toBe(2);
    expect(jar.get("ASP.NET_SessionId")).toBe("sess1");
    expect(jar.get(".ASPXAUTH")).toBe("auth1");
    expect(jar.has("ASP.NET_SessionId")).toBe(true);
    expect(jar.toHeader()).toBe("ASP.NET_SessionId=sess1; .ASPXAUTH=auth1");
  });

  it("does not split on commas inside cookie attributes", () => {
    // A naive headers.get("set-cookie") split would break this Expires value.
    const jar = new CookieJar();
    jar.mergeFromResponse(
      responseWithSetCookies(["ASP.NET_SessionId=sess1; expires=Wed, 21 Oct 2026 07:28:00 GMT; path=/"]),
    );
    expect(jar.size).toBe(1);
    expect(jar.get("ASP.NET_SessionId")).toBe("sess1");
  });

  it("merges across responses, later values overwriting earlier ones", () => {
    const jar = new CookieJar();
    jar.mergeFromResponse(responseWithSetCookies(["ASP.NET_SessionId=first; path=/"]));
    jar.mergeFromResponse(
      responseWithSetCookies(["ASP.NET_SessionId=second; path=/", ".ASPXAUTH=auth; path=/"]),
    );
    expect(jar.size).toBe(2);
    expect(jar.get("ASP.NET_SessionId")).toBe("second");
    // Overwriting keeps the original insertion order.
    expect(jar.toHeader()).toBe("ASP.NET_SessionId=second; .ASPXAUTH=auth");
  });

  it("keeps existing cookies when a response sets none", () => {
    const jar = new CookieJar();
    jar.mergeSetCookies(["ASP.NET_SessionId=sess1"]);
    jar.mergeFromResponse(responseWithSetCookies([]));
    expect(jar.toHeader()).toBe("ASP.NET_SessionId=sess1");
  });

  it("skips malformed Set-Cookie entries", () => {
    const jar = new CookieJar();
    jar.mergeSetCookies(["garbage", "ok=1", "=bad"]);
    expect(jar.names()).toEqual(["ok"]);
  });

  it("falls back to the joined header when getSetCookie is unavailable", () => {
    const jar = new CookieJar();
    jar.mergeFromResponse(legacyResponse("ASP.NET_SessionId=sess1; path=/; HttpOnly"));
    expect(jar.get("ASP.NET_SessionId")).toBe("sess1");
  });

  it("returns undefined for unknown cookies", () => {
    const jar = new CookieJar();
    expect(jar.get("nope")).toBeUndefined();
    expect(jar.has("nope")).toBe(false);
  });
});

describe("playdate options", () => {
  const selectHtml =
    '<select name="ddlPlaydate" id="ddlPlaydate">' +
    '<option selected="selected" value="August 12, 2026 - Wednesday">August 12, 2026 - Wednesday</option>' +
    '<option value="August 13, 2026 - Thursday">August 13, 2026 - Thursday</option>' +
    '<option value="August 14, 2026 - Friday">August 14, 2026 - Friday</option>' +
    "</select>";

  it("extracts all option values", () => {
    expect(extractPlaydateOptions(selectHtml)).toEqual([
      "August 12, 2026 - Wednesday",
      "August 13, 2026 - Thursday",
      "August 14, 2026 - Friday",
    ]);
  });

  it("returns [] when the select is missing", () => {
    expect(extractPlaydateOptions("<html></html>")).toEqual([]);
  });

  it("converts option labels to ISO dates", () => {
    expect(playdateOptionToISO("August 13, 2026 - Thursday")).toBe("2026-08-13");
    expect(playdateOptionToISO("January 2, 2027 - Saturday")).toBe("2027-01-02");
  });

  it("returns null for unparseable labels", () => {
    expect(playdateOptionToISO("not a date")).toBeNull();
    expect(playdateOptionToISO("Wharrgarbl 5, 2026")).toBeNull();
  });
});
