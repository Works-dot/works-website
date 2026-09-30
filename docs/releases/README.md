# Works. — ellenőrzött kiadási csomag

Ellenőrzés: 2026-09-16. **Ez előkészítés, nem végrehajtott deploy.**

## Mi kerül ki?

A `website-release-manifest.json` a teljes rögzített fájllista, fájlonként SHA-256 ellenőrzőösszeggel. A `website-release.patch` pontosan 33 fájlt módosít:

- 31 website-fájl: képoptimalizálás, healthcheck, hibakezelés, SEO és kapcsolódó tesztek.
- `pnpm-lock.yaml`: a website `sharp` buildfüggősége; ezen kívül csak egy meglévő csomag elavultsági jelölése változott.
- `.gitignore`: a build által generált `public/media` kizárása.

GitHub alap: `14ce1f6fe03a5d10b3cd88fdd54803955885a22f`.
Helyi forráspillanat: `c70e092b26b6a66020078fbed7c166a66f77c64a`.

Az összes további eltérés az `excludedPaths` listán található. Ezek nem részei a patchnek:
1191 Strapi upload-eltérés, Strapi frissítésellenőrzési metaadat, feltöltött referenciák, képernyőképek, belső jegyzetek és dokumentáció.
Az API-server és a Strapi alkalmazáskód nem tér el a GitHub-alaptól.
**Nincs CMS-adatátvitel, médiatörlés, adatbázis-módosítás vagy API-kiadás.**

## Ellenőrzési eredmények

- A távoli GitHub main ágat olvasással azonosítottuk. A hozzá tartozó Railway website státusz sikeres; a Strapi státusz szerint nem volt szükség új kiadásra.
- A patch az alapverzió tiszta másolatán `git apply --check` ellenőrzéssel hibamentesen alkalmazható.
- Az egzakt GitHub-alapból és a patchből külön ideiglenes környezetet állítottunk elő, kizárólag az alapban meglévő CMS-uploadokkal. Ebben a production build/prerender, typecheck, 76 SEO/nyelvi ellenőrzés és 12 célzott teszt sikeres.
- Az ellenőrzés a már telepített node_modules függőségeket használta újra; nem volt külön friss frozen-lockfile telepítés. A CMS-adatok a commitolt cache-ből származtak, nem új éles CMS-lekérésből.
- A tesztelt build szerverén `/healthz` és `/readyz` egyaránt 200-as JSON választ és no-store cache-fejlécet adott.
- A csomag generált `image-manifest.ts` fájlját ebből a ténylegesen tesztelt, szűkebb upload-készletből állítottuk elő. A Railway prebuild ezt újragenerálja.
- A Railway build a `pnpm install --frozen-lockfile --prod=false` paranccsal telepít, így a sharp buildfüggőség is elérhető. Ezután CMS-adatlekérés, hero-ellenőrzés és statikus build következik. Az éles CMS-elérés és a Railway build végső eredménye csak kiadáskor igazolható.
- A jelenlegi Railway `/readyz` még 404: az új végpont nincs kint. Ez nem az új csomag hibája.
- A Replit éles API `https://works-website.replit.app/api/healthz` válasza `{"status":"ok"}`. Ez nem e-mail-küldési vagy Mailchimp-próba.

### Képoptimalizálási korlát — tudatosan szűkített kiadási ígéret

**A teljes CMS-képállomány optimalizálása nem része ennek a csomagnak.**
A commitolt cache 220 raster CMS-képe közül a GitHub-alapban csak 11 eredeti érhető el; 209 URL változatlan `/strapi/uploads/...` proxycím marad. Ezekhez nem keletkezik helyi WebP. Az elérhető források és a website saját képei optimalizálódnak.
Nem másolunk be ellenőrizetlen CMS-uploadokat, és nem állítjuk, hogy az összes CMS-kép kisebb lesz.
A korábbi `docs/performance-report.md` nagyobb helyi upload-készlettel mért százalékai **nem ennek a kiadási csomagnak a teljesítményeredményei**.
A Railway új CMS-lekérése tovább módosíthatja a kép- és oldallefedettséget; ezt az éles build és az utóellenőrzés igazolja majd.

## Kiadás indítása — a felhasználó végzi

Az alábbi parancsokat a Replit Shellben, a workspace gyökeréből lehet futtatni.
Az új klón megkerüli a workspace eltérő checkpoint-előzményeit.
A push GitHub-írási jogosultságot igényel; titkot ne írj a parancsba vagy a chatbe.
**Az utolsó push elindíthatja a Railway automatikus kiadását.**

```bash
set -eu
WORKSPACE="$PWD"
BASE=14ce1f6fe03a5d10b3cd88fdd54803955885a22f
RELEASE_DIR="$(mktemp -d /tmp/works-release.XXXXXX)"
git clone https://github.com/Works-dot/works-website.git "$RELEASE_DIR"
cd "$RELEASE_DIR"
test "$(git rev-parse origin/main)" = "$BASE"
git switch -c release/website-performance "$BASE"
git apply --check "$WORKSPACE/docs/releases/website-release.patch"
git apply "$WORKSPACE/docs/releases/website-release.patch"
python3 - "$WORKSPACE/docs/releases/website-release-manifest.json" \
  "$WORKSPACE/docs/releases/website-release.patch" <<'PY'
import hashlib, json, pathlib, subprocess, sys
m = json.loads(pathlib.Path(sys.argv[1]).read_text())
assert hashlib.sha256(pathlib.Path(sys.argv[2]).read_bytes()).hexdigest() == m["patchSha256"]
for entry in m["files"]:
    assert hashlib.sha256(pathlib.Path(entry["path"]).read_bytes()).hexdigest() == entry["sha256"], entry["path"]
expected = {entry["path"] for entry in m["files"]}
changed = set(subprocess.check_output(["git", "diff", "--name-only", "-z"]).decode().strip("\0").split("\0"))
untracked = set(filter(None, subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard", "-z"]).decode().split("\0")))
assert changed | untracked == expected
PY
git diff --check
git add -- .gitignore pnpm-lock.yaml artifacts/works-website
git diff --cached --stat
git commit -m "Optimize website images and add launch health checks"
git fetch origin main
test "$(git rev-parse origin/main)" = "$BASE"
# Csak a fájllista áttekintése és jóváhagyása után:
git push origin HEAD:main
```

Ha az alapverzió-ellenőrzés vagy bármely más ellenőrzés hibázik, **állj meg**.
Ne használj force-push-t, és ne alkalmazd a patch-et vakon új alapra.
Ha a GitHub írási hozzáférés nincs beállítva, a kiadás itt megáll; a csomag önmagában nem biztosít hitelesítést.
A meglévő website-only release helper nem használható ehhez a csomaghoz, mert a gyökér lockfile-t kihagyná.

## Railway ellenőrzés a push után

Website szolgáltatás:
https://railway.com/project/137c2eb2-135b-431f-83cb-cf5d219ad443/service/f1927cc9-68f6-4e8a-99c6-0350cd424c89

Várd meg az új commithoz tartozó sikeres buildet és `/readyz` próbát. Egy régi sikeres deployment nem igazolja az új kiadást.
A root lockfile módosítása miatt a Strapi újraépülhet a watch-beállításoktól függően, bár Strapi-forrásváltozás nincs.
A build-sorrendet ne kerüld meg; DNS-t, `SITE_URL`-t és `CANONICAL_ORIGIN`-t most ne változtass.

```bash
SITE=https://workspaceworks-website-production.up.railway.app
curl --fail-with-body -i "$SITE/healthz"
curl --fail-with-body -i "$SITE/readyz"
curl --fail-with-body -I "$SITE/healthz"
curl --fail-with-body -I "$SITE/readyz"
curl --fail-with-body -I "$SITE/"
curl --fail-with-body -I "$SITE/en"
curl --fail-with-body -I "$SITE/karrier"
```

Elvárás: a healthcheckek 200-as JSON választ, `Cache-Control: no-store` fejlécet adnak;
a HEAD válaszban nincs törzs. A HU/EN oldalak betöltődnek, a képek láthatók.
Egy tényleges HTML-ből kiolvasott `/media/` kép URL-je 200-at és immutable cache-fejlécet adjon.
Az ismeretlen útvonal legyen valódi 404. Mobilon ellenőrizendő a főoldal és a karrieroldal.

Nem történt tesztlevél, feliratkozás vagy CV-feltöltés. Külső monitoring nincs bekapcsolva.
A helyi teljesítménymérés nem helyettesíti az éles ellenőrzést.

## Visszaállítás

A kiadás előtti sikeres website deployment:
`cedfa61e-9b89-45a2-a365-8e2094a2ee3c`, forrása a fenti GitHub alapverzió.
Kiadás előtt ellenőrizd, hogy ez még elérhető a Railway deployment-listában.

Hibás új kiadásnál a Railway korábbi sikeres deploymentjére állj vissza, majd ellenőrizd a HU/EN oldalakat.
A régi változatban `/readyz` még nincs, ezért annál nem elvárás a 200-as readyz.
A GitHub-forrás tartós visszaállításához az új kiadási commitot normál `git revert` committal kell visszavonni, nem force-push-sal.
Nincs visszaállítandó adatbázis-migráció ebben a csomagban.