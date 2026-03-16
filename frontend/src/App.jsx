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
              <>RFQ Triage Agent: Anfragen in <span className="text-orange-600">Minuten analysieren</span></>
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
              <>🤖 PDF hochladen • KI analysiert • Teile über Partflow beschaffen</>
            )}
          </p>

          {/* Module Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
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
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🚀 RFQ Triage Agent
            </button>
          </div>
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
          <p>© 2025 Partflow.net - Powered by DFSC Engineering. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
