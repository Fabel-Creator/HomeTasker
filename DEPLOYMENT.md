# Deployment-Anleitung für HaushaltsManager

Diese Anleitung zeigt Ihnen, wie Sie die HaushaltsManager-App auf externen Plattformen wie Render, Heroku oder ähnlichen deployen.

## ✅ Bereits durchgeführte Änderungen

Die App wurde bereits vorbereitet für externe Deployments:

- ✅ **Replit Auth entfernt** - Verwendet nur noch lokale Admin-Accounts und Gast-Zugänge
- ✅ **Neon PostgreSQL verbunden** - Ihre bereitgestellte Datenbank wird verwendet
- ✅ **Vereinfachte Authentifikation** - Session-basiertes System ohne externe Abhängigkeiten
- ✅ **Frontend angepasst** - Keine Replit-spezifischen Login-Buttons mehr

## 🚀 Deployment auf Render

### 1. Repository vorbereiten

```bash
# Diese Dateien für Production entfernen (nur bei Deployment):
rm vite.config.ts
echo 'import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});' > vite.config.ts

# Replit-spezifische Packages entfernen (nur bei Deployment):
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

### 2. Umgebungsvariablen auf Render

Setzen Sie diese Environment Variables in Render:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_WIVl52iDjpKo@ep-tiny-sun-a2rfm81h-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-12345678
NODE_ENV=production
PORT=10000
```

### 3. Render Service konfigurieren

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment:** `Node`
**Auto-Deploy:** `Yes`

### 4. Datenbank-Migration

Nach dem ersten Deployment:

```bash
# Via Render Shell oder lokal mit Production DB URL:
npm run db:push
```

## 🌐 Alternative Plattformen

### Heroku
```bash
heroku create your-app-name
heroku config:set DATABASE_URL="your-neon-db-url"
heroku config:set SESSION_SECRET="your-secret-key"
heroku config:set NODE_ENV=production
git push heroku main
```

### Vercel (Serverless)
- Frontend auf Vercel, Backend separat (Render/Railway)
- Edge Runtime für bessere Performance
- Umgebungsvariablen im Dashboard setzen

### Railway
```bash
railway login
railway new
railway add --database postgresql
railway deploy
```

## 🔐 Sicherheitshinweise für Production

1. **SESSION_SECRET ändern** - Verwenden Sie einen starken, zufälligen Schlüssel
2. **HTTPS erzwingen** - Cookies werden nur über sichere Verbindungen übertragen
3. **Rate Limiting** - Implementieren Sie Begrenzungen für Login-Versuche
4. **Monitoring** - Überwachen Sie Logs und Performance

## 🎯 Nach dem Deployment

1. **Admin-Account erstellen:**
   - Besuchen Sie `https://ihre-domain.com/local-admin`
   - Registrieren Sie sich als erster Admin

2. **Haushalt erstellen:**
   - Melden Sie sich als Admin an
   - Erstellen Sie Ihren ersten Haushalt
   - Notieren Sie sich den Einladungscode

3. **Mitglieder hinzufügen:**
   - Teilen Sie den Link `https://ihre-domain.com/guest` und den Einladungscode
   - Mitglieder können sich ohne Registrierung anmelden

## 📊 Features der App

- **Rollenbasierte Zugriffe:** Admins und Gäste mit unterschiedlichen Rechten
- **Aufgabenverwaltung:** Zuweisen, verfolgen und abschließen von Haushaltsaufgaben
- **Zeiterfassung:** Protokollieren von Arbeitszeit mit Genehmigungsworkflow
- **Einkaufslisten:** Gemeinsame Listen für Haushaltseinkäufe
- **Analytics:** Übersicht über erledigte Aufgaben und Zeitverteilung
- **Benachrichtigungen:** Updates über neue Aufgaben und Genehmigungen

Die App ist jetzt vollständig unabhängig von Replit und bereit für das Deployment auf beliebigen Hosting-Plattformen!