# Railway telepítési útmutató — Works.

Ez az útmutató végigvezet a Works. projekt Railway-re költöztetésén. Két szolgáltatás
fog futni egy Railway projekten belül, közös PostgreSQL adatbázissal:

| Szolgáltatás | Mit csinál | Honnan épül |
|--------------|------------|-------------|
| **Strapi CMS** | Tartalomkezelő + admin felület + képek | `artifacts/strapi` |
| **Works. website** | A publikus statikus weboldal + `/strapi` proxy | `artifacts/works-website` |
| **PostgreSQL** | Az adatbázis (Strapi tartalom) | Railway plugin |

Architektúra: a weboldal egy kis Node szerverrel fut, ami kiszolgálja a statikus oldalt
**és** a `/strapi/*` kéréseket továbbítja a Strapi szolgáltatásnak. Így minden egyetlen
publikus domainen érhető el (pl. `works.hu` és `works.hu/strapi/admin`), pontosan úgy,
ahogy most Replit-en.

---

## A te dolgod (Railway felületen)

### 1. Projekt + GitHub
- Hozz létre egy Railway projektet, és kösd hozzá a GitHub repót (ezt már megtetted).

### 2. PostgreSQL hozzáadása
- A projektben: **+ New → Database → PostgreSQL**.

### 3. Strapi szolgáltatás
- **+ New → GitHub Repo** → válaszd ki a repót (ugyanaz a repo, külön szolgáltatásként).
- A szolgáltatás **Settings**-jében:
  - **Root Directory**: hagyd üresen (a repo gyökere — a pnpm workspace miatt fontos).
  - **Config-as-code / Railway Config File**: `artifacts/strapi/railway.json`.
- **Variables** (lásd a lenti listát) — köztük a friss secretek.
- **Volume**: csatolj egy Volume-ot, **Mount path**: `/app/artifacts/strapi/public/uploads`
  (így a feltöltött képek megmaradnak újratelepítéskor; az első indításkor automatikusan
  betöltődnek a repóban lévő meglévő képek).
- Generálj publikus domaint: **Settings → Networking → Generate Domain**.

### 4. Website szolgáltatás
- **+ New → GitHub Repo** → ugyanaz a repo.
- **Settings**:
  - **Root Directory**: üresen.
  - **Railway Config File**: `artifacts/works-website/railway.json`.
- **Variables** (lásd lent) — itt a `STRAPI_URL` a Strapi szolgáltatás publikus URL-je.
- Generálj publikus domaint (ez lesz a fő oldal).

### 5. Egyedi domain (opcionális)
- Mindkét szolgáltatásnál a **Settings → Networking → Custom Domain** alatt adhatsz meg
  saját domaint, és Railway megmutatja a beállítandó DNS rekordokat.

---

## Környezeti változók

### Strapi szolgáltatás

| Változó | Érték |
|--------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway referencia a Postgres pluginra) |
| `PUBLIC_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `STRAPI_ADMIN_BACKEND_URL` | `/strapi` |
| `STRAPI_APP_KEYS` | a generált érték (lásd lent) |
| `ADMIN_JWT_SECRET` | a generált érték |
| `API_TOKEN_SALT` | a generált érték |
| `TRANSFER_TOKEN_SALT` | a generált érték |
| `JWT_SECRET` | a generált érték |

> A `PORT`-ot a Railway automatikusan beállítja — ne add meg kézzel.
> A `NODE_ENV=production`-t **ne** állítsd be szolgáltatás-szintű változóként (a build
> során a fejlesztői függőségekre is szükség van) — a `railway.json` az indításkor
> automatikusan beállítja.

### Website szolgáltatás

| Változó | Érték |
|--------|-------|
| `STRAPI_URL` | a Strapi szolgáltatás publikus URL-je, pl. `https://works-cms-production.up.railway.app` |
| `VITE_STRAPI_ENABLED` | `false` |

> A `STRAPI_URL` kell a build során (tartalom letöltése) **és** futásidőben (a `/strapi` proxy).
> A `BASE_PATH` alapból `/`, nem kell megadni, ha a fő domainen gyökérben fut.

---

## Secretek generálása

A repo gyökeréből futtasd:

```bash
node scripts/railway/gen-secrets.mjs
```

Ez kiír egy friss készletet (`STRAPI_APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`,
`TRANSFER_TOKEN_SALT`, `JWT_SECRET`). Másold be őket a Strapi szolgáltatás Variables-ébe.
Ezek **új** production secretek — a meglévő admin jelszó (bejelentkezés) ettől még működik.

---

## Adat- és képmigráció

A **képek** automatikusan átkerülnek: a `artifacts/strapi/public/uploads` mappa a repóban
van, és az első Railway indításkor a szerver bemásolja őket a Volume-ba. Külön teendő nincs.

A **tartalom** (szövegek, projektek, blog stb.) a PostgreSQL-ben van, ezt át kell másolni:

1. Szerezd meg a forrás (Replit) és a cél (Railway) adatbázis URL-jét.
   - Railway: a Postgres plugin **Variables** fülén a `DATABASE_URL` (külső eléréshez a
     publikus változat).
2. A repo gyökeréből:

```bash
# 1) Mentés a jelenlegi adatbázisból
SOURCE_DATABASE_URL="postgres://...replit..." ./scripts/railway/dump-strapi-db.sh

# 2) Visszatöltés a Railway adatbázisba
TARGET_DATABASE_URL="postgres://...railway..." ./scripts/railway/restore-strapi-db.sh
```

> **Időzítés:** a visszatöltést a Strapi első indulása előtt (vagy közvetlenül utána,
> amíg senki nem szerkeszt) érdemes futtatni. A mentés `--clean --if-exists` opcióval
> készül, így biztonságosan újrafuttatható.
>
> **Rövid leállás:** a mentés–visszatöltés alatt (kb. 10–30 perc) ne szerkesszetek
> tartalmat, hogy ne vesszen el módosítás.

---

## Ellenőrző lista telepítés után

1. **Strapi admin** betölt: `https://<website-domain>/strapi/admin` — be tudsz lépni.
2. **Tartalom megvan**: a projektek, blogbejegyzések, szolgáltatások stb. látszanak az adminban.
3. **Képek megjelennek** az adminban (meglévő médiák a Media Library-ben).
4. **Weboldal renderel**: a fő domain betölt, a szövegek és képek helyesen jelennek meg.
5. **Új kép feltöltés** túléli az újratelepítést: tölts fel egy képet az adminban, indíts egy
   redeploy-t a Strapi szolgáltatáson, és ellenőrizd, hogy a kép megmaradt (a Volume miatt).

---

## Tartalom frissítése a jövőben

A weboldal statikus (build időben tölti le a Strapi tartalmát). Ha tartalmat módosítasz az
adminban, és szeretnéd a publikus oldalon is látni, indíts egy **Redeploy**-t a **website**
szolgáltatáson — a build újra letölti a friss tartalmat és újragenerálja az oldalt.
