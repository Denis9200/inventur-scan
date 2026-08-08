# Inventur Scan V7 – Lagerbestand, Verwendungszwecke & echter CSV-Import

## Echter CSV-Import
Auf den hochgeladenen Export abgestimmt:
- Name
- Produktmarke
- Produktgruppe
- Preis
- Einkaufspreis
- Bestand

Die Datei darf wie der echte Export mit `Produkte` + Leerzeile beginnen.
Die App sucht die tatsächliche Kopfzeile automatisch.

Wichtig: Der aktuelle Export enthält keine Barcode-Spalte.
Daher gibt es bei unbekanntem Scan jetzt:
- Weiter scannen
- Vorhandenem Artikel zuordnen
- Neuen Artikel anlegen

Damit kann ein gescannter Barcode einem bereits importierten CSV-Artikel zugeordnet werden.

## Datenmodell
Lagerbestand und Inventurzählung sind jetzt getrennt:
- `stockByLocation` = aktueller operativer Lagerbestand
- `counts` = Ist-Zählung während einer Inventur
- `expected` = Sollbestand der Inventur

## Verwendungszwecke pro Artikel
Ein Artikel kann mehrere Rollen gleichzeitig haben:
- Kundenverkauf
- Mitarbeiterverkauf
- Kabinettware
- Inventar / Arbeitsmittel

Beispiel Schneidkamm:
Ein Teil bleibt normaler Lagerbestand, einzelne Stück können als Salon-Inventar ausgegeben werden.

## Mitarbeiterverkauf
- Artikel für Mitarbeiterverkauf freigeben
- Standardpreis EK + MwSt.
- MwSt.-Satz pro Artikel änderbar
- alternativ fester Mitarbeiterpreis
- Menge + Lagerort auswählen
- Verkauf zieht direkt aus dem operativen Lagerbestand ab
- Verlauf wird gespeichert

## Inventar / Arbeitsmittel
- Artikel als Arbeitsmittel freigeben
- Stückzahl aus einem Lagerort ins Salon-Inventar ausgeben
- Lagerbestand sinkt
- Inventar-Anzahl steigt
- Bereich / Einsatzort + Notiz möglich

## Kabinettware
Bestehende Gramm-/Tube-Logik bleibt erhalten:
- Gramm pro VE
- offene Tube
- Entnahme
- Schwund
- Tube leer
- neue Tube öffnet aus Lagerbestand

## Artikelstamm
Zusätzlich:
- Marke
- Produktgruppe
- Barcode
- Rollen
- Mitarbeiter-Preisregel
- MwSt.
- Salon-Inventar-Anzahl
