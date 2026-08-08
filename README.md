# DJ Lager & Inventur V8

Komplette Neuorganisation der bisherigen Inventur-App.

## Hauptbereiche
- Dashboard
- Betrieb
  - Lagerbestand
  - Kabinettware
  - Mitarbeiterverkauf
  - Inventar / Arbeitsmittel
- Lagerbestand
- Inventur
- Historie

## Lagerbestand
Der operative Lagerbestand ist unabhängig von Inventuren.
Betriebsvorgänge wie Mitarbeiterverkauf, Kabinettware oder Inventar verändern nur den Lagerbestand und schreiben einen Historieneintrag.

## Inventur
Eine neue Inventur erhält einen frei wählbaren Namen.
Beim Start wird ein Snapshot des aktuellen Lagerbestands erzeugt.
Danach verändert sich die Inventur nicht durch spätere Betriebsvorgänge.
Eine abgeschlossene Inventur verändert den Lagerbestand derzeit bewusst nicht automatisch.

## Historie
Zentrale Warenbewegungen:
- Bestandsimport
- manuelle Bestandsänderung
- Mitarbeiterverkauf
- Kabinettware geöffnet
- Verbrauch
- Schwund
- Gebinde leer
- ins Inventar überführt
- Inventar defekt/verloren/entsorgt
- zurück ins Lager

## Inventar / Arbeitsmittel
Arbeitsmittel können aus dem Lager ins Salon-Inventar überführt werden.
Später können sie mit Grund entfernt oder wieder zurück ins Lager gelegt werden.

## Scanner
Quagga2, stabilisierte Mehrfacherkennung und EAN/UPC-Prüfziffer.
Unbekannte Barcodes können einem bestehenden Artikel zugeordnet oder neu angelegt werden.

## CSV
Import ist weiterhin für den bereitgestellten Salonkee-Export vorbereitet.
