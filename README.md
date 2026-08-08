# Inventur Scan V6d – Runtime-/Button-Fix

## Gefundener Fehler
Beim V6-Umbau wurde der Button `demoBtn` aus dem Dashboard entfernt.
In `app.js` stand aber weiterhin:

`$('demoBtn').addEventListener(...)`

Da das Element nicht mehr existierte, entstand beim Laden der App ein JavaScript-Fehler.
Der Browser brach die weitere Initialisierung ab. Deshalb reagierten danach u. a.:

- Kamera / Scanner
- „+ Neuer Artikel“
- Popups
- weitere Buttons

nicht mehr.

## Behoben
- Zugriff auf den optionalen Demo-Button ist jetzt abgesichert.
- Service-Worker-Cache erneut geändert, damit die defekte JS-Datei nicht weiter geladen wird.
- Statischer UI-Check: Keine fehlenden direkten Event-Ziele gefunden.

Die Funktionen aus V6 bleiben erhalten:
- Inventur
- Quagga2 Barcode-Scanner
- unbekannte Barcodes → Artikel anlegen
- Lagerbestand / Artikel bearbeiten
- Betrieb
- Kabinettware in Gramm
- Tube leer
- Schwund / Verlust
- Verbrauchshistorie

Nach GitHub-Upload die PWA komplett schließen und neu öffnen.
