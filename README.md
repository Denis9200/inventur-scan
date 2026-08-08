# Inventur Scan V5 – Step 6: Quagga2 Scanner

Der Live-Scanner wurde von html5-qrcode auf Quagga2 umgestellt.

Warum:
- Fokus auf echte 1D-Produktbarcodes
- EAN-13 / EAN-8
- UPC-A / UPC-E
- Code 128 / Code 39
- Interleaved 2 of 5
- bessere Live-Lokalisierung von länglichen Barcodes

iPhone/iPad:
- Rückkamera
- 1920x1080 bevorzugt
- ohne Worker für bessere Safari-Kompatibilität
- geringere Scanfrequenz
- Foto-Scan bleibt als Fallback erhalten

Android:
- Rückkamera
- Worker werden genutzt, soweit verfügbar
- Taschenlampe bleibt als optionale Funktion

Nach GitHub Upload:
1. installierte PWA vollständig schließen
2. neu öffnen
3. falls weiterhin alte Oberfläche/Scanner läuft: PWA entfernen und erneut installieren
