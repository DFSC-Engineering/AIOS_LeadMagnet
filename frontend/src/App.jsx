import { useState } from 'react'
import CostOfFrictionCalculator from './components/CostOfFrictionCalculator'
import ResultsDashboard from './components/ResultsDashboard'
import BomRiskSentinel from './components/BomRiskSentinel'
import RfqTriageAgent from './components/RfqTriageAgent'
import { calculateResults } from './utils/calculations'

function App() {
  const [activeModule, setActiveModule] = useState('friction') // 'friction' | 'bom' | 'rfq'
  const [results, setResults] = useState(null)

  const handleCalculate = (formData) => {
    const calculatedResults = calculateResults(formData)
    setResults(calculatedResults)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleReset = () => {
    setResults(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleModuleSwitch = (module) => {
    setActiveModule(module)
    setResults(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img 
              src="/partflow-logo.png" 
              alt="Partflow Logo" 
              className="h-12"
            />
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Business OS</h2>
              <p className="text-sm text-gray-600">Powered by DFSC Engineering</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="https://www.partflow.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Partflow.net →
            </a>
            <a 
              href="https://www.dfsc-engineering.de" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-700 font-semibold"
            >
              DFSC Engineering →
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {activeModule === 'friction' ? (
              <>Cost of Friction Rechner: Versteckte Kosten in der <span className="text-primary-600">Fertigung aufdecken</span></>
            ) : activeModule === 'bom' ? (
              <>BOM Risk Sentinel: <span className="text-purple-600">Lieferketten-Risiken</span> in Stücklisten identifizieren</>
            ) : (
              <>RFQ Triage Agent: Anfragen in <span className="text-blue-700">Minuten analysieren</span></>
            )}
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            {activeModule === 'friction' ? (
              <>Ermitteln Sie Margenpotenziale durch operative Reibung in Vertrieb, Beschaffung und Produktion.</>
            ) : activeModule === 'bom' ? (
              <>Analysieren Sie Ihre Stücklisten auf Single-Source-Risiken, lange Lieferzeiten, Obsoleszenz und mehr.</>
            ) : (
              <>Laden Sie eine Anfrage hoch — KI extrahiert Positionen, bewertet Chancen und empfiehlt GO/NO-GO.</>
            )}
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            {activeModule === 'friction' ? (
              <>📈 Quantifizieren Sie ETO-Engpässe, PDF-Fallen und BOM-Disconnect – in nur 5 Minuten</>
            ) : activeModule === 'bom' ? (
              <>🎯 Upload • Analyse • Report – Identifizieren Sie kritische Bauteile in Sekunden</>
            ) : (
              <>🤖 PDF hochladen • KI extrahiert alle Positionen • GO / MAYBE / NO-GO in Minuten</>
            )}
          </p>

          {/* Module Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <button
              onClick={() => handleModuleSwitch('friction')}
              className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
                activeModule === 'friction'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💰 Cost of Friction Rechner
            </button>
            <button
              onClick={() => handleModuleSwitch('bom')}
              className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
                activeModule === 'bom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎯 BOM Risk Sentinel
            </button>
            <button
              onClick={() => handleModuleSwitch('rfq')}
              className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
                activeModule === 'rfq'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🚀 RFQ Triage Agent
            </button>
          </div>

          {/* Module Intro Card */}
          {activeModule === 'friction' && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-cyan-100 overflow-hidden text-left mb-2">
              <div className="bg-primary-600 px-6 py-3 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Cost of Friction Rechner</p>
                  <p className="text-cyan-100 text-sm">Versteckte Margen-Fresser in Ihrem Fertigungsbetrieb sichtbar machen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Das Problem</p>
                  <p className="text-sm text-gray-700">Operative Reibung in Vertrieb, Beschaffung und Produktion kostet Fertigungsbetriebe jährlich 8–15 % der Marge — ohne dass diese Verluste je klar beziffert werden.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Ihr Vorteil</p>
                  <p className="text-sm text-gray-700">In 5 Minuten erhalten Sie eine konkrete Zahl: Wie viel € Marge verlieren Sie jährlich? Wo liegt das größte Einsparpotenzial? Wie schnell amortisiert sich eine Verbesserung?</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Im Bericht enthalten</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>→ Kosten nach Symptom-Clustern (ETO, PDF, BOM)</li>
                    <li>→ Margenpotenzial & Zielmarge</li>
                    <li>→ Priorisierte Handlungsempfehlungen</li>
                    <li>→ ROI-Projektion mit Partflow.net</li>
                  </ul>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Aufwand & Ergebnis</p>
                  <p className="text-sm text-gray-700 mb-2"><span className="font-semibold text-primary-600">~5 Minuten</span> Fragebogen ausfüllen</p>
                  <p className="text-sm text-gray-700">Ergebnis: Mehrseitiger PDF-Report, sofort druckfertig — kostenlos und unverbindlich.</p>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'bom' && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-purple-100 overflow-hidden text-left mb-2">
              <div className="bg-purple-600 px-6 py-3 flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">BOM Risk Sentinel</p>
                  <p className="text-purple-200 text-sm">Lieferkettenrisiken in Stücklisten automatisch erkennen und bewerten</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Das Problem</p>
                  <p className="text-sm text-gray-700">Stücklisten mit hunderten Positionen enthalten unsichtbare Zeitbomben: Single-Source-Teile, EOL-Bauteile und Positionen mit 20+ Wochen Lieferzeit gefährden ganze Produktionslinien.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Ihr Vorteil</p>
                  <p className="text-sm text-gray-700">Laden Sie Ihre BOM (Excel/CSV) hoch — die Analyse liefert in Sekunden einen vollständigen Risiko-Score je Position, priorisierte Kritikalität und geschätzte Folgekosten.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Im Bericht enthalten</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>→ Risikoverteilung (Kritisch / Hoch / Mittel)</li>
                    <li>→ Top-10 kritische Bauteile mit Score</li>
                    <li>→ Geschätzte Risikokosten pro Jahr</li>
                    <li>→ Priorisierte Handlungsempfehlungen</li>
                  </ul>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Aufwand & Ergebnis</p>
                  <p className="text-sm text-gray-700 mb-2"><span className="font-semibold text-purple-600">~2 Minuten</span> Upload + Spalten-Mapping</p>
                  <p className="text-sm text-gray-700">Ergebnis: Druckfertiger PDF-Report mit vollständiger Risikomatrix — kostenlos und unverbindlich.</p>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'rfq' && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden text-left mb-2">
              <div className="bg-blue-700 px-6 py-3 flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">RFQ Triage Agent</p>
                  <p className="text-blue-100 text-sm">Anfragen in Minuten bewerten — GO oder NO-GO, bevor Sie einen Stift ansetzen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Das Problem</p>
                  <p className="text-sm text-gray-700">Die Erstbewertung einer Anfrage kostet 30–120 Minuten Vertriebszeit — oft für Anfragen, die man nie hätte annehmen sollen. Schlechte Triage bedeutet vergeudete Kalkulations-Ressourcen.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Ihr Vorteil</p>
                  <p className="text-sm text-gray-700">PDF, Text oder BOM hochladen — die KI extrahiert alle Positionen, schätzt Aufwand und Win-Wahrscheinlichkeit und gibt eine klare GO / MAYBE / NO-GO-Empfehlung.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Im Bericht enthalten</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>→ GO / NO-GO Entscheidung + Begründung</li>
                    <li>→ Alle Positionen strukturiert extrahiert</li>
                    <li>→ Stärken, Risiken & offene Fragen</li>
                    <li>→ Antwort-Template & Partflow-Empfehlung</li>
                  </ul>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Aufwand & Ergebnis</p>
                  <p className="text-sm text-gray-700 mb-2"><span className="font-semibold text-blue-700">~1 Minute</span> Upload + KI-Analyse</p>
                  <p className="text-sm text-gray-700">Ergebnis: Strukturierte Triage-Analyse mit PDF-Report und KI-generiertem Antwort-Entwurf.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Main Content */}
      <main className="py-12 px-4">
        {activeModule === 'friction' ? (
          !results ? (
            <CostOfFrictionCalculator onCalculate={handleCalculate} />
          ) : (
            <ResultsDashboard results={results} onReset={handleReset} />
          )
        ) : activeModule === 'bom' ? (
          <BomRiskSentinel />
        ) : (
          <RfqTriageAgent />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-20">
        <div className="max-w-5xl mx-auto text-center">
          <p>© {new Date().getFullYear()} Partflow.net · Powered by DFSC Engineering · Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
