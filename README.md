# V5 Scanner Fix B

Kamerastart vereinfacht und robuster gemacht.

1. Zuerst Start mit `facingMode: "environment"`.
2. Falls das Android-Gerät das ablehnt, werden Kameras aufgelistet und die Rückkamera per Kamera-ID gestartet.
3. Scanner bleibt auf typische Produktbarcodes beschränkt:
   EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF.
4. Fehlermeldung zeigt bei erneutem Start einen konkreteren Scannerfehler an.
5. Service-Worker-Cache wurde geändert, damit die alte defekte Scannerdatei nicht weiterverwendet wird.

Nach GitHub-Upload:
- installierte PWA komplett schließen
- erneut öffnen
- falls nötig Chrome-Seite einmal neu laden
