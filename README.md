# Inventur Scan V5 – iPhone/iPad Scanner Fix

iOS-Anpassungen:
- Live-Scanner startet mit einfacher `facingMode: "environment"` Konfiguration.
- Auf iPhone/iPad kein erzwungener Autofokus, Zoom oder Torch beim Start.
- Niedrigere FPS für Safari.
- Größerer Scanbereich für 1D-EAN-Barcodes.
- BarcodeDetector wird auf iOS nicht erzwungen.
- Kamera-ID-Fallback, falls `facingMode` nicht funktioniert.
- zusätzlicher „Foto scannen“-Fallback für iPhone/iPad.
- Foto-Fallback liest EAN-13, EAN-8, UPC, Code 128, Code 39 und ITF.
- Android bleibt weiterhin unterstützt.

Nach GitHub-Upload:
1. PWA/Safari komplett schließen.
2. Neu öffnen.
3. Falls noch alte Dateien erscheinen: Safari-Seite neu laden bzw. PWA einmal entfernen und neu zum Home-Bildschirm hinzufügen.
