import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useCookieConsent } from "@/lib/cookie-consent";

// Rövid magyar nyelvű süti tájékoztató. A sütisáv és a lábléc hivatkozik rá.
export default function Sutik() {
  const { openSettings } = useCookieConsent();

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="pt-28 lg:pt-36 pb-20 lg:pb-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-8 leading-tight">
              Süti (cookie) tájékoztató
            </h1>

            <div className="space-y-6 text-works-dark/70 leading-relaxed">
              <p>
                A sütik (cookie-k) kis szöveges fájlok, amelyeket a
                meglátogatott weboldalak helyeznek el a böngésződben. A Works.
                weboldala a lehető legkevesebb sütit használja: nem futtatunk
                látogatáskövetést, statisztikai vagy marketing célú mérést.
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                Feltétlenül szükséges tárolás
              </h2>
              <p>
                A süti-hozzájárulásoddal kapcsolatos döntésedet a böngésződ
                helyi tárolójában (localStorage, <code>works-cookie-consent</code>{" "}
                kulcs) jegyezzük meg, hogy ne kelljen minden látogatáskor újra
                nyilatkoznod. Ez nem kerül továbbításra senkinek, és bármikor
                törölhető a böngésző adatainak törlésével.
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                Harmadik féltől származó tartalom: Google Térkép
              </h2>
              <p>
                A Kapcsolat oldalon irodánk elhelyezkedését beágyazott Google
                Térkép mutatja. A térkép betöltésekor a Google LLC sütiket
                helyezhet el, és adatokat (pl. IP-cím) kezelhet a saját
                adatkezelési szabályzata szerint. Ezért a térkép csak akkor
                töltődik be, ha ehhez kifejezetten hozzájárultál — a sütisávon
                vagy közvetlenül a térkép helyén megjelenő gombbal. A Google
                adatkezeléséről itt olvashatsz:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-works-primary font-semibold underline hover:no-underline"
                >
                  Google adatvédelmi irányelvek
                </a>
                .
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                Betűtípusok
              </h2>
              <p>
                A weboldal betűtípusait saját szerverünkről szolgáljuk ki, így a
                megjelenítésükhöz nem történik adattovábbítás külső
                szolgáltató felé.
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                A hozzájárulás módosítása
              </h2>
              <p>
                Döntésedet bármikor megváltoztathatod a lábléc „Süti
                beállítások” hivatkozásával, vagy az alábbi gombbal:
              </p>
              <button
                type="button"
                onClick={openSettings}
                className="px-6 py-3 text-sm font-semibold bg-works-primary text-white hover:bg-works-primary/90 transition-colors"
                data-testid="button-open-cookie-settings"
              >
                Süti beállítások megnyitása
              </button>

              <p className="pt-4">
                A személyes adatok kezeléséről bővebben az{" "}
                <a
                  href="/adatkezeles"
                  className="text-works-primary font-semibold underline hover:no-underline"
                >
                  adatkezelési tájékoztatóban
                </a>{" "}
                olvashatsz.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
