import { useState, useEffect } from 'react'
import RfqUploader from './RfqUploader'
import RfqAnalysisDashboard from './RfqAnalysisDashboard'

const ANALYSIS_STEPS = [
  { label: 'Dokument wird gelesen...', duration: 1200 },
  { label: 'Positionen werden extrahiert...', duration: 1400 },
  { label: 'Technische Anforderungen analysieren...', duration: 1000 },
  { label: 'Triage-Score wird berechnet...', duration: 800 },
  { label: 'Handlungsempfehlungen generieren...', duration: 600 },
]

function AnalyzingScreen() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const timers = ANALYSIS_STEPS.map((step, idx) => {
      const timer = setTimeout(() => {
        setCurrentStep(idx + 1)
      }, elapsed + step.duration)
      elapsed += step.duration
      return timer
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">KI analysiert Ihre Anfrage</h2>
        <p className="text-gray-500">Claude liest und strukturiert das Dokument...</p>
      </div>

      <div className="space-y-3 text-left">
        {ANALYSIS_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {idx < currentStep ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : idx === currentStep ? (
              <div className="w-6 h-6 border-2 border-orange-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
            ) : (
              <div className="w-6 h-6 border-2 border-gray-200 rounded-full flex-shrink-0"></div>
            )}
            <span className={`text-sm ${
              idx < currentStep ? 'text-green-700 font-medium line-through' :
              idx === currentStep ? 'text-orange-700 font-semibold' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-orange-50 rounded-lg p-4">
        <p className="text-sm text-orange-700">
          <strong>Tipp:</strong> Claude erkennt Positionen, Materialien, Toleranzen und Lieferanforderungen
          direkt aus Ihrem Dokument — ohne manuelle Eingabe.
        </p>
      </div>
    </div>
  )
}

export default function RfqTriageAgent() {
  const [step, setStep] = useState('input') // 'input' | 'analyzing' | 'results' | 'error'
  const [analysisResult, setAnalysisResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleAnalyze = async (payload) => {
    setStep('analyzing')

    try {
      const response = await fetch('/.netlify/functions/analyze-rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server-Fehler: ${response.status}`)
      }

      setAnalysisResult(data)
      setStep('results')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrorMessage(err.message)
      setStep('error')
    }
  }

  const handleReset = () => {
    setStep('input')
    setAnalysisResult(null)
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="py-8 px-4">
      {step === 'input' && (
        <RfqUploader onAnalyze={handleAnalyze} />
      )}

      {step === 'analyzing' && (
        <AnalyzingScreen />
      )}

      {step === 'results' && (
        <RfqAnalysisDashboard
          analysisResult={analysisResult}
          onReset={handleReset}
        />
      )}

      {step === 'error' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Analyse fehlgeschlagen</h2>
          <p className="text-gray-600 mb-2 bg-red-50 rounded-lg p-4 text-sm font-mono">{errorMessage}</p>
          <p className="text-gray-500 text-sm mb-8">
            Mögliche Ursachen: API-Key nicht konfiguriert, Dokument zu groß, oder Netzwerkfehler.
          </p>
          <button
            onClick={handleReset}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
          >
            ← Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
