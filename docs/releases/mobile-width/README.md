# Mobil szélesség — célzott GitHub-kiadás

**Csak előkészítve; sem push, sem Railway deploy nem történt.** Az előző
feladat sikeres helyi Chromium-ellenőrzése és iPhone/Safari-korlátja:
`docs/mobile-home-width-report.md` (a workspace gyökerében).

2026-09-28-án a GitHub `Works-dot/works-website` `main` HEAD-je
`14ce1f6fe03a5d10b3cd88fdd54803955885a22f` volt. A mellékelt
`manifest.json` és `release.patch` ehhez a **pontos** alaphoz tartozik.
Pontosan két website-fájlt érint: a blog mobil carouseljének célzott
festési korlátozását és az új szélességi regresszióellenőrzést. A
workspace többi website-változtatása, root lockfile, Strapi-képek,
CMS/adatbázis, dokumentumok és képernyőképek **nincsenek benne**.
Különösen a korábbi, szélesebb képoptimalizálási/healthcheck-kiadás
csomagját nem szabad ezzel összekeverni; az továbbra sincs a main ágon.
`release-website.mjs` itt nem használható: a teljes helyi website
pillanatképet küldené, nem ezt a kétfájlos célzott kiadást.

## Bizonyítás, korlát

- Az aktuális nyilvános GitHub main HEAD-et olvasással ellenőriztük.
- A patch a távoli alap tiszta archivált másolatára alkalmazható. Az
  alkalmazás után mindkét fájl SHA-256 összege egyezik a manifesttel és
  a jóváhagyott forrásfájlokkal; más fájl nem módosul.
- Az **ebből a két fájlból épített, pontos távoli alap** Vite/SSR
  production buildje 123 oldalt prerenderelt és a typecheck sikeres.
  Meglévő helyi node_modules függőségeket használtunk; nem futott tiszta
  frozen-lockfile telepítés vagy új éles CMS-lekérés.
- A korábbi 12/12 Chromium szélességi próba a helyi fejlesztői
  pillanatképen ment át, **nem ezen a kizárólag két fájlt tartalmazó
  rekonstruált kiadáson**. Ezért a Railway build és a tényleges éles
  oldal kiadás utáni mérése kötelező; nincs igazolt Safari/iPhone-próba.
- `https://worksdot.hu/` jelenleg 308-cal
  `https://www.worksdot.hu/`-ra irányít; a `www` jelenleg ugyanazt a
  fő JS assetet adja, mint a Railway website URL. A domain/caching
  viselkedés a kiadás után újra ellenőrizendő.

## Felhasználó által indított push

Ezeket a parancsokat a workspace gyökeréből, megfelelő GitHub írási
jogosultsággal rendelkező shellben futtasd. A Replit csatlakozás nem
feltétlenül ad át Git CLI hitelesítőt; ha a push hitelesítési hibával
megáll, állíts be saját biztonságos GitHub hitelesítést, **ne írj tokent
parancssorba vagy chatbe**. A parancsok nem force-pusholnak. A végső
push automatikus Railway buildet indíthat.

```bash
set -eu
WORKSPACE="$PWD"
BASE=14ce1f6fe03a5d10b3cd88fdd54803955885a22f
PATCH="$WORKSPACE/docs/releases/mobile-width/release.patch"
MANIFEST="$WORKSPACE/docs/releases/mobile-width/manifest.json"
RELEASE_DIR="$(mktemp -d /tmp/works-mobile-release.XXXXXX)"
git clone https://github.com/Works-dot/works-website.git "$RELEASE_DIR"
cd "$RELEASE_DIR"
test "$(git rev-parse origin/main)" = "$BASE" || {
  echo "GitHub main elmozdult: ÁLLJ MEG, új csomag kell." >&2
  exit 1
}
git switch -c release/mobile-width "$BASE"
git apply --check "$PATCH"
git apply "$PATCH"
node --input-type=module - "$MANIFEST" "$PATCH" <<'JS'
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const [manifestPath, patchPath] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(manifestPath));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(readFileSync(patchPath)), manifest.patchSha256);
for (const file of manifest.files) {
  assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
}
const changed = execFileSync('git', ['diff', '--name-only', '-z']).toString().split('\0').filter(Boolean);
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean);
assert.deepEqual([...changed, ...untracked].sort(), manifest.files.map(f => f.path).sort());
JS
git diff --check
git add -- artifacts/works-website/src/components/ui/MobileCarousel.tsx \
  artifacts/works-website/scripts/test-mobile-width.mjs
git diff --cached --stat
git commit -m "Prevent mobile homepage width expansion from blog carousel"
git fetch origin main
test "$(git rev-parse origin/main)" = "$BASE" || {
  echo "GitHub main elmozdult: ne pusholj, kérj új ellenőrzést." >&2
  exit 1
}
# Csak a két fájl és a commit jóváhagyása után:
git push origin HEAD:main
```

A push non-force, normál fast-forward; a közvetlen előtte lévő HEAD-ellenőrzés
eltéréskor leáll, de egy ellenőrzés utáni versenyhelyzet ellen nem
garantál atomikus compare-and-swap védelmet. Ha szigorú atomikus
elutasítás szükséges, a csatlakoztatott GitHub API GraphQL `updateRefs`
`beforeOid=$BASE` és `force:false` műveletével kell kiadni, nem
`--force-with-lease`-zel. **Ha a távoli ág bármikor elmozdul, ne
alkalmazd vakon az eredeti patch-et új alapra.**

## Éles ellenőrzés és visszaállítás

GitHubon az új commit hashét és a Railway **website** szolgáltatás
sikeres, pontosan ahhoz a commithoz tartozó deploymentjét ellenőrizd.
Az, hogy a korábbi build sikeres, nem elég. A root apex átirányítása
után a `https://www.worksdot.hu/` és a Railway website URL új JS
assetjének egyeznie kell, cache miatt friss betöltéssel is.

A workspace-ből, telepített Playwright Chromium esetén passzívan:

```bash
cd artifacts/works-website
MOBILE_WIDTH_TEST_URL=https://www.worksdot.hu \
  node scripts/test-mobile-width.mjs
```

A teszt 320/360/390/412/430 px HU/EN, fekvő és desktop nézetet,
menüt és belső carousel-scrollt vizsgál; nem küld formot. Valódi
iPhone Safariban külön ellenőrizd a hero/fejléc kitöltését, az alsó
blogkártyákat, menüt és a vízszintes oldalirányú elmozdulást. A
korábbi környezet WebKitje hiányzó rendszerkönyvtárak miatt nem indult.
Ha a Railway build vagy az éles teszt nem sikeres, ne állítsd késznek
a kiadást.

Visszaállítási forráspont: `$BASE` (a kiadás előtt ezt ellenőrizd a
GitHub/Railway deployment felületein is). Ha az új website hibás,
a Railway előző sikeres website deploymentjét lehet visszaállítani;
GitHubon a kiadási commitot normál `git revert` committal kell
visszavonni. Nincs adatbázis-migráció; tilos force-push, DNS-váltás
vagy Strapi adat-visszaállítás e kétfájlos kiadás miatt.