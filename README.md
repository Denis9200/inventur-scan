# Inventur Scan V6e – stabiler Barcode-Scan

Problem:
Beim schnellen 1D-Scan konnte Quagga während eines einzigen Kameraschwenks mehrere falsche Zwischenwerte liefern.
Dadurch wurden verschiedene unbekannte Barcodes nacheinander als neue Artikel angeboten.

Lösung:
- EAN-/UPC-Prüfziffer wird validiert.
- Der erste Decoder-Treffer wird NICHT mehr sofort akzeptiert.
- Bekannte Artikel müssen mindestens 2x identisch erkannt werden.
- Unbekannte Barcodes müssen mindestens 4x identisch erkannt werden.
- Kandidaten verfallen nach kurzer Zeit automatisch.
- Erst nach dieser Bestätigung wird das Kamerabild eingefroren und ein zweiter Decode durchgeführt.
- Der zweite Decode darf den bereits stabil bestätigten Barcode nicht mehr durch einen zufälligen anderen Wert überschreiben.
- Nach bestätigtem Scan wird der Decoder gesperrt, bis der Produktflow abgeschlossen ist.

Ergebnis:
Ein einzelner Produktbarcode sollte jetzt nur noch genau einmal verarbeitet werden.
Unbekannte Artikel werden erst angeboten, wenn derselbe Barcode wirklich stabil erkannt wurde.

Nach GitHub-Upload:
PWA komplett schließen und neu öffnen.
