# Deployment-Anleitung für Dokploy

## ✅ Code-Änderungen (bereits gemacht)

Alle notwendigen Code-Änderungen sind implementiert:
- ✅ Body Size Limit auf 50MB erhöht
- ✅ Datenbank-Migrationen für Media-Felder
- ✅ Upload-Routes für Avatare, Banner und Submissions
- ✅ Fallbacks für fehlende Bilder

## ⚠️ Wichtig: Persistent Storage konfigurieren

Die hochgeladenen Bilder (Avatare, Banner, Submissions) müssen **persistent gespeichert** werden, sonst gehen sie bei jedem Deployment verloren!

### Lösung: Volume in Dokploy einrichten

1. **Öffne deine Dokploy-Anwendung** (jahrbuch-elzach)

2. **Navigiere zu "Volumes" oder "Mounts"**

3. **Erstelle ein neues Volume:**
   - **Host-Pfad**: `/var/dokploy/uploads/jahrbuch-elzach` (oder ein anderer persistenter Pfad auf deinem Server)
   - **Container-Pfad**: `/app/public/uploads`
   - **Typ**: Bind Mount oder Volume

4. **Speichere die Konfiguration** und starte das Deployment neu

### Alternative: Umgebungsvariable für Upload-Pfad

Falls du einen anderen Pfad verwenden möchtest, kannst du auch eine Umgebungsvariable setzen:

```env
UPLOAD_DIR=/data/uploads
```

Dann müssten die Upload-APIs angepasst werden, um diese Variable zu verwenden.

## 🗄️ Datenbank

Die Datenbank-Migrationen laufen automatisch beim ersten Laden der `/browse` oder `/admin` Seite.

Stelle sicher, dass die MySQL-Datenbank erreichbar ist und die Umgebungsvariablen korrekt gesetzt sind:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## 📝 Nach dem Deployment testen

1. ✅ Deployment erfolgreich
2. ✅ `/browse` Seite lädt ohne 500-Fehler
3. ✅ Bilder können hochgeladen werden (Upload bis 50MB)
4. ⚠️ **Hochgeladene Bilder bleiben nach einem Re-Deploy erhalten** (nur wenn Volume konfiguriert)

## 🔧 Troubleshooting

### Problem: Bilder verschwinden nach Re-Deploy
**Ursache**: Kein Volume konfiguriert
**Lösung**: Volume für `/app/public/uploads` einrichten (siehe oben)

### Problem: 413 Request Entity Too Large
**Ursache**: Nginx/Reverse Proxy limitiert die Upload-Größe
**Lösung**: In deinem Reverse Proxy (z.B. Nginx) die `client_max_body_size` auf mindestens 50MB setzen:
```nginx
client_max_body_size 50M;
```

### Problem: Bilder werden nicht angezeigt
**Ursache**: Upload-Routes funktionieren nicht oder Dateien fehlen
**Lösung**: 
1. Prüfe die Browser-Konsole auf 404-Fehler
2. Prüfe die Container-Logs
3. Stelle sicher, dass das Volume korrekt gemountet ist

## 🚀 Aktueller Stand

Der Code ist **deployment-ready**! 

Nur noch das Volume konfigurieren, dann sollte alles funktionieren.

