# Lokale Entwicklung Setup

Diese Anweisungen helfen dir dabei, die App lokal mit Cursor oder anderen Code-Editoren zu starten.

## Voraussetzungen

- Node.js 18+ installiert
- npm oder yarn
- Optional: PostgreSQL (oder nutze SQLite für einfacheres Setup)

## Setup für lokale Entwicklung

### 1. Repository klonen und Dependencies installieren

```bash
# Dependencies installieren
npm install
```

### 2. Umgebungsvariablen einrichten

```bash
# Kopiere die Beispiel-Konfiguration
cp .env.example .env

# Bearbeite .env mit deinen lokalen Einstellungen
```

### 3. Database Setup

#### Option A: SQLite (Einfacher)
In deiner `.env` Datei:
```
DATABASE_URL="file:./local.db"
```

#### Option B: PostgreSQL (Erweitert)
1. PostgreSQL lokal installieren
2. Database erstellen:
   ```bash
   createdb your_database_name
   ```
3. In deiner `.env` Datei:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   ```

### 4. Database Schema pushen

```bash
# Schema zur Database pushen
npm run db:push
```

### 5. App starten

```bash
# Für lokale Entwicklung auf localhost:3000
NODE_ENV=development PORT=3000 npm run dev

# Oder direkter Aufruf
npx tsx server/index.ts
```

## Zugriff auf die App

- Öffne deinen Browser und gehe zu: http://localhost:3000
- Die API ist verfügbar unter: http://localhost:3000/api/*

## Tipps für Cursor/VS Code

1. **TypeScript Unterstützung**: Das Projekt ist vollständig typisiert
2. **Hot Reload**: Änderungen werden automatisch neu geladen
3. **Debugging**: Du kannst Breakpoints in Cursor/VS Code setzen
4. **Database Management**: Nutze Drizzle Studio für DB-Management:
   ```bash
   npx drizzle-kit studio
   ```

## Unterschiede zur Replit-Version

- Läuft auf localhost:3000 statt 0.0.0.0:5000
- Keine Replit-spezifischen Plugins aktiv
- Lokale Database-Konfiguration möglich
- Optimiert für lokale Entwicklung

## Troubleshooting

### Port bereits in Verwendung
```bash
# Anderen Port verwenden
PORT=3001 npm run dev
```

### Database Verbindungsprobleme
```bash
# Prüfe ob DATABASE_URL gesetzt ist
echo $DATABASE_URL

# Database neu erstellen
rm -f local.db
npm run db:push
```

### Module nicht gefunden
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```