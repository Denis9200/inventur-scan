# Inventur Scan V5 – Step 7: Scan bestätigen

Der Live-Scanner arbeitet jetzt zweistufig:

1. Quagga erkennt im Kamerastream einen Barcode → Rahmen wird grün.
2. Genau in diesem Moment wird das aktuelle Kamerabild intern eingefroren/aufgenommen.
3. Dieses Bild wird ein zweites Mal mit mehreren 1D-Decodern ausgewertet.
4. Danach wird der Barcode gegen den Artikelbestand geprüft.
5. Bei Treffer öffnet sich automatisch das besprochene Produktfenster.
6. Bei unbekanntem Barcode wird die gelesene Nummer angezeigt und der Scanner startet erneut.

Zusätzlich:
- toleranter Abgleich zwischen UPC-A und EAN-13 mit führender Null
- Schutz vor mehrfachen Popups beim selben Scan
- funktioniert weiterhin auf iPhone/iPad und Android

Nach GitHub-Upload die PWA vollständig schließen und neu öffnen.
