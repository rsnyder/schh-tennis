# Court sheet markup findings (captured 2026-08-12)

## Flow (verified live)
1. Login POST (see `scripts/capture-fixture.mjs`) → 302 to `/tennis/TNwelcome2.aspx`.
2. GET `/tennis/TNReviewCourtSheet.aspx` → 200, but this is a **selection form**, not the sheet:
   - `<form name="form1" method="post" action="./TNReviewCourtSheet.aspx">`
   - Hidden: `__EVENTTARGET`, `__EVENTARGUMENT`, `__LASTFOCUS`, `__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__SCROLLPOSITIONX`, `__SCROLLPOSITIONY`, `__EVENTVALIDATION`
   - `<select name="ddlPlaydate">` — options like `August 12, 2026 - Wednesday` (value == label), **today is preselected**; 4 days offered
   - Facility checkboxes, all checked by default: `cbCourse1` (South), `cbCourse2` (North), `cbCourse3` (West)
   - Submit: `btnDisplay` value `Display`
3. POST back with tokens + `ddlPlaydate=<selected option value>` + `cbCourse1..3=on` + `btnDisplay=Display` → 200 with the sheet (~97 KB). Captured as `courtsheet-display-2026-08-12.html`.

## Sheet markup
- Single `<table ... id="GridView2">`, 1 header row (`<th scope="col">`) + 169 data rows, uniformly 7 `<td>` per row.
- Columns: `Time | Facility | Court # | Player 1 | Player 2 | Player 3 | Player 4`
- Times formatted `07:30 AM` … `08:30 PM`. Facility ∈ {North, South, West}. Court # zero-padded (`01`).
- Empty player cell = `&nbsp;`. Special block entries exist, e.g. `* Round Robin`, `* New to Tennis` (repeated across all 4 player cells).
- Per-facility grids differ and are NOT a full cross-product:
  - North: 4 courts × 9 times (complete)
  - South: 12 courts, 14 times, only 109 of 168 combos present (some courts not offered at some times)
  - West: 3 courts × 8 times (complete)
- Missing (time, court) combo = that court isn't scheduled/offered at that time — distinct from present-but-empty (open).
