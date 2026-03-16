# AI Business OS - Lead Magnet Tool

> Quantifizieren Sie operative Ineffizienzen in industriellen Wertschöpfungsketten

Ein interaktives Web-Tool zur Analyse und Quantifizierung von operativen Reibungskosten in Industrieunternehmen. Entwickelt von DFSC Engineering für Partflow.net.

## 🎯 Projektübersicht

Das AI Business OS Lead Magnet Tool hilft Industrieunternehmen dabei:
- **Cost of Friction** zu quantifizieren (€/Jahr und % vom Umsatz)
- **4 Symptom-Cluster** zu identifizieren und priorisieren
- **ROI-Potenzial** mit Partflow.net zu berechnen
- **Handlungsempfehlungen** mit konkreten Lösungen zu erhalten

## 🚀 Quick Start

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone https://github.com/dfsc-engineering/AIOS_LeadMagnet.git
cd AIOS_LeadMagnet/frontend

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Build für Production
npm run build
```

Der Development Server läuft auf: `http://localhost:3000`

## 📁 Projektstruktur

```
AIOS_LeadMagnet/
├── docs/                          # Projekt-Dokumentation
│   ├── PROJECT_BRIEFING.md
│   ├── CALCULATION_LOGIC.md
│   ├── TODO.md
│   └── QUICK_START.md
├── frontend/                      # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CostOfFrictionCalculator.jsx
│   │   │   └── ResultsDashboard.jsx
│   │   ├── utils/
│   │   │   └── calculations.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── .gitignore
├── netlify.toml
└── README.md
```

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Form Management:** React Hook Form + Zod
- **Charts:** Chart.js + react-chartjs-2
- **PDF Export:** jsPDF
- **Hosting:** Netlify

## 📊 Module

### Modul 1: Cost of Friction Rechner ✅
Interaktiver Rechner zur Quantifizierung von:
- **ETO-Vertriebs-Engpass** (Quoting Quagmire)
- **PDF-Falle** (Manuelle Dateneingabe)
- **Dark Purchasing** (Fragmentierte Beschaffung)
- **BOM-Disconnect** (Späte Sourcing-Probleme)

**Features:**
- Live-Berechnungen mit Validierung
- Visualisierungen (Pie Chart, Bar Chart)
- Detaillierte Kostenanalyse
- Priorisierte Handlungsempfehlungen
- ROI-Projektion

### Modul 2: BOM Risk Sentinel 🚧
*Coming Soon* - Früherkennung von Lieferrisiken

### Modul 3: RFQ Triage Agent 🚧
*Coming Soon* - KI-gestützte Angebotsstrukturierung

## 🚀 Deployment

### Netlify (Empfohlen)

1. **Via Netlify Dashboard:**
   ```bash
   # Code auf GitHub pushen
   git push origin main
   
   # In Netlify Dashboard:
   # - "Import from Git" wählen
   # - Repository verbinden
   # - Deploy
   ```

2. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Custom Domain Setup

Für `aios.partflow.net`:

1. In Netlify Dashboard: "Domain settings" → "Add custom domain"
2. Bei Domain-Provider CNAME hinzufügen:
   ```
   Name: aios
   Type: CNAME
   Value: [deine-site].netlify.app
   ```
3. SSL wird automatisch aktiviert ✅

## 📝 Development

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Build Preview
npm run preview

# Linting
npm run lint
```

## 🔧 Konfiguration

### Umgebungsvariablen (optional)

Erstelle `.env` für lokale Entwicklung:

```env
# Google Analytics (optional)
VITE_GA_ID=G-XXXXXXXXXX

# API Endpoints (falls Backend)
VITE_API_URL=https://api.example.com
```

## 📈 Analytics & Tracking

- Google Analytics 4 Integration vorbereitet
- Form-Tracking für Lead-Generierung
- Event-Tracking für User Journey

## 🎨 Branding

Das Tool verwendet die Farbpalette von DFSC/Partflow:
- **Primary:** Blue (#0ea5e9)
- **Cluster Colors:**
  - Orange (#ea580c) - ETO
  - Red (#dc2626) - PDF
  - Purple (#9333ea) - Purchasing
  - Yellow (#ca8a04) - BOM

## 📄 Lizenz

© 2025 DFSC Engineering. Alle Rechte vorbehalten.

## 📞 Kontakt

**DFSC Engineering**
- Website: https://www.dfsc-engineering.de
- E-Mail: info@dfsc-engineering.de
- Tel: +49 6331 7296114
- Adresse: Marie-Curie-Str. 14, 66953 Pirmasens

**Partflow.net**
- Website: https://www.partflow.net
- Platform: Digitale Beschaffung für industrielle Fertigung

---

Entwickelt mit ❤️ von DFSC Engineering
