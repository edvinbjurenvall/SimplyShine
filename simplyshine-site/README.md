# SimplyShine – Hemsida

## Deploya till Netlify

1. Gå till [netlify.com](https://app.netlify.com) och logga in
2. Klicka **"Add new site"** → **"Deploy manually"**
3. Dra och släpp hela `simplyshine-site` mappen
4. Klar! Din sida är live.

## Sätt upp Formspree (formulär)

Formulären skickar idag till placeholder-URLs. Så här fixar du det:

1. Gå till [formspree.io](https://formspree.io) och skapa ett gratis konto
2. Skapa **2 formulär**:
   - Ett för bokningar (boka-sidan)
   - Ett för kontakt (kontakt-sidan)
3. Kopiera form-ID:t (ser ut som `xyzabcde`)
4. Byt ut i filerna:
   - `boka.html`: Ersätt `YOUR_BOOKING_FORM_ID` med ditt boknings-ID
   - `kontakt.html`: Ersätt `YOUR_CONTACT_FORM_ID` med ditt kontakt-ID

## Filstruktur

```
simplyshine-site/
├── index.html          ← Startsida
├── tjanster.html       ← Tjänster & Priser
├── sa-funkar-det.html  ← Så Funkar Det
├── om-oss.html         ← Om Oss
├── boka.html           ← Bokningsformulär
├── kontakt.html        ← Kontakt
├── style.css           ← Alla stilar
├── script.js           ← JavaScript
├── _redirects          ← Netlify clean URLs
└── README.md           ← Denna fil
```

## Anpassa domän

I Netlify: **Site settings** → **Domain management** → **Add custom domain** → `simplyshine.se`
