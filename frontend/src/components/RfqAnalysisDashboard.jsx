import { useState } from 'react'
import LeadCaptureModal from './LeadCaptureModal'
import { generateRfqPDF } from '../utils/rfqPdfGenerator'

export default function RfqAnalysisDashboard({ analysisResult, onReset }) {
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [responseTemplate, setResponseTemplate] = useState(null)
  const [showResponseModal, setShowResponseModal] = useState(false)

  const {
    projektInfo = {},
    positionen = [],
    technischeAnforderungen = [],
    lieferbedingungen = {},
    triage = {},
    offeneFragen = [],
    partflowRelevanz = {}
  } = analysisResult

  const empfehlung = triage.empfehlung || 'MAYBE'

  const triageConfig = {
    GO: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-400',
      badge: 'bg-green-600',
      text: 'text-green-800',
      label: '✅ GO — Angebot abgeben',
      icon: '🟢'
    },
    MAYBE: {
      bg: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-400',
      badge: 'bg-yellow-500',
      text: 'text-yellow-800',
      label: '⚠️ MAYBE — Rückfragen klären',
      icon: '🟡'
    },
    NO_GO: {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-400',
      badge: 'bg-red-600',
      text: 'text-red-800',
      label: '🛑 NO-GO — Anfrage ablehnen',
      icon: '🔴'
    }
  }

  const cfg = triageConfig[empfehlung] || triageConfig.MAYBE

  // ── Anfrage-Qualität berechnen (aus den extrahierten Feldern) ──
  const calculateRfqQuality = () => {
    let found = 0
    let total = 0

    // Projektinfo-Felder
    ;[projektInfo.titel, projektInfo.kunde, projektInfo.angebotsFrist, projektInfo.ansprechpartner].forEach(v => {
      total++
      if (v && v !== 'Unbekannt' && v !== null && v !== 'null') found++
    })

    // Positionen vorhanden?
    total++
    if (positionen.length > 0) found++

    // Material bei mindestens 50% der Positionen angegeben?
    if (positionen.length > 0) {
      total++
      const withMaterial = positionen.filter(p => p.material && p.material !== 'null' && p.material !== null).length
      if (withMaterial / positionen.length >= 0.5) found++
    }

    // Lieferbedingungen
    ;[lieferbedingungen.liefertermin, lieferbedingungen.lieferort].forEach(v => {
      total++
      if (v && v !== 'null') found++
    })

    // Technische Anforderungen
    total++
    if (technischeAnforderungen.length > 0) found++

    const percent = total > 0 ? Math.round((found / total) * 100) : 0

    if (percent >= 80) return { label: 'Vollständig',    color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500',  percent }
    if (percent >= 60) return { label: 'Gut strukturiert', color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',   percent }
    if (percent >= 40) return { label: 'Lückenhaft',      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',  percent }
    return               { label: 'Unklar',           color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500',    percent }
  }
  const rfqQuality = calculateRfqQuality()

  const handleLeadSubmit = async (leadData) => {
    await generateRfqPDF(analysisResult, leadData)
    setShowLeadModal(false)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 6000)
  }

  const handleGenerateResponse = async () => {
    setIsGeneratingResponse(true)
    try {
      const response = await fetch('/.netlify/functions/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setResponseTemplate(data.template)
      setShowResponseModal(true)
    } catch (err) {
      alert('Fehler beim Generieren: ' + err.message)
    } finally {
      setIsGeneratingResponse(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl shadow-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold mb-2">RFQ Triage Analyse</h2>
            <p className="text-blue-100 text-lg">
              {projektInfo.titel || 'Anfrage'} — {projektInfo.kunde || 'Unbekannter Auftraggeber'}
            </p>
            {projektInfo.angebotsFrist && (
              <p className="text-blue-200 text-sm mt-1">Angebotsfrist: {projektInfo.angebotsFrist}</p>
            )}
          </div>
          <button
            onClick={onReset}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ← Neue Analyse
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 flex items-start gap-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Report heruntergeladen!</h3>
            <p className="text-green-800">
              Unser Team meldet sich für ein unverbindliches Gespräch über Ihre Beschaffungsstrategie.
            </p>
            <a href="https://www.partflow.net" target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-semibold text-sm mt-2 block">
              Teile jetzt auf Partflow.net anfragen →
            </a>
          </div>
        </div>
      )}

      {/* TRIAGE AMPEL — Hauptfokus */}
      <div className={`bg-gradient-to-r ${cfg.bg} border-2 ${cfg.border} rounded-2xl p-8`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className={`${cfg.badge} text-white px-6 py-3 rounded-xl font-bold text-2xl flex-shrink-0 shadow-lg`}>
            {cfg.icon} {empfehlung}
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${cfg.text} mb-2`}>{cfg.label}</h3>
            <p className={`${cfg.text} text-base leading-relaxed`}>{triage.begruendung}</p>
          </div>
        </div>
      </div>

      {/* Metriken-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Anfrage-Qualität (ersetzt Win-Wahrscheinlichkeit) */}
        <div className={`bg-white rounded-xl shadow-lg p-5 text-center border-2 ${rfqQuality.border}`}>
          <div className={`text-xl font-bold ${rfqQuality.color} mb-1 leading-tight`}>{rfqQuality.label}</div>
          <div className="text-sm text-gray-600 font-medium">Anfrage-Qualität</div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${rfqQuality.dot}`}
              style={{ width: `${rfqQuality.percent}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{rfqQuality.percent}% Felder ausgefüllt</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">{triage.aufwandsSchaetzung?.stunden || '—'}h</div>
          <div className="text-sm text-gray-600 font-medium">Geschätzter Aufwand</div>
          <div className="text-xs text-gray-400 mt-1">{triage.aufwandsSchaetzung?.komplexitaet}</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">{positionen.length}</div>
          <div className="text-sm text-gray-600 font-medium">Positionen erkannt</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {typeof partflowRelevanz.beschaffbareParts === 'number' && partflowRelevanz.beschaffbareParts > 0
              ? partflowRelevanz.beschaffbareParts
              : partflowRelevanz.beschaffbareParts === 0 ? '—' : positionen.length}
          </div>
          <div className="text-sm text-gray-600 font-medium">Partflow-relevant</div>
        </div>

      </div>

      {/* Positionen-Tabelle */}
      {positionen.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 Extrahierte Positionen ({positionen.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Pos.</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Teilenummer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Beschreibung</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Menge</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Material</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Toleranz</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Liefertermin</th>
                </tr>
              </thead>
              <tbody>
                {positionen.map((pos, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">{pos.pos || idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{pos.teilenummer || '—'}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{pos.beschreibung}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{pos.menge} {pos.einheit}</td>
                    <td className="px-4 py-3 text-gray-600">{pos.material || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{pos.toleranz || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{pos.liefertermin || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stärken & Risiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {triage.staerken?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4">✅ Stärken dieser Anfrage</h3>
            <ul className="space-y-2">
              {triage.staerken.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-green-700 text-sm">
                  <span className="font-bold mt-0.5">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {triage.risiken?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Risiken & Herausforderungen</h3>
            <ul className="space-y-2">
              {triage.risiken.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                  <span className="font-bold mt-0.5">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Technische Anforderungen */}
      {technischeAnforderungen.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Technische Anforderungen</h3>
          <div className="flex flex-wrap gap-2">
            {technischeAnforderungen.map((req, i) => (
              <span key={i} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-1 rounded-full">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lieferbedingungen */}
      {(lieferbedingungen.liefertermin || lieferbedingungen.lieferort) && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚚 Lieferbedingungen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lieferbedingungen.liefertermin && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Liefertermin</div>
                <div className="font-semibold text-gray-900">{lieferbedingungen.liefertermin}</div>
              </div>
            )}
            {lieferbedingungen.lieferort && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Lieferort</div>
                <div className="font-semibold text-gray-900">{lieferbedingungen.lieferort}</div>
              </div>
            )}
            {lieferbedingungen.incoterms && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Incoterms</div>
                <div className="font-semibold text-gray-900">{lieferbedingungen.incoterms}</div>
              </div>
            )}
            {lieferbedingungen.zahlungsziel && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Zahlungsziel</div>
                <div className="font-semibold text-gray-900">{lieferbedingungen.zahlungsziel}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offene Fragen */}
      {offeneFragen.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-amber-800 mb-4">❓ Offene Fragen vor Angebotsabgabe</h3>
          <ul className="space-y-2">
            {offeneFragen.map((frage, i) => (
              <li key={i} className="flex items-start gap-3 text-amber-800 text-sm">
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{frage}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Partflow Relevanz Banner */}
      {partflowRelevanz.empfehlung && (
        <div className="bg-gradient-to-r from-blue-50 to-primary-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <img src="/partflow-logo.png" alt="Partflow" className="h-8 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Partflow.net Empfehlung</h3>
              <p className="text-blue-800">{partflowRelevanz.empfehlung}</p>
              {partflowRelevanz.vorteile?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {partflowRelevanz.vorteile.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTION CENTER */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">🚀 Nächste Schritte</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partflow CTA — Hauptaktion */}
          <a
            href="https://www.partflow.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="text-4xl">🛒</div>
            <div>
              <div className="font-bold text-lg">Teile über Partflow beschaffen</div>
              <div className="text-primary-100 text-sm mt-1">
                24h Angebot • 200+ geprüfte Fertigungspartner
              </div>
            </div>
            <div className="ml-auto text-2xl group-hover:translate-x-1 transition-transform">→</div>
          </a>

          {/* Antwort-Template */}
          <button
            onClick={handleGenerateResponse}
            disabled={isGeneratingResponse}
            className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all group disabled:opacity-60"
          >
            <div className="text-4xl">{isGeneratingResponse ? '⏳' : '✍️'}</div>
            <div className="text-left">
              <div className="font-bold text-lg">
                {isGeneratingResponse ? 'Wird generiert...' : 'Antwort-Template generieren'}
              </div>
              <div className="text-blue-100 text-sm mt-1">KI-Entwurf in Deutsch erstellen</div>
            </div>
            <div className="ml-auto text-2xl group-hover:translate-x-1 transition-transform">→</div>
          </button>

          {/* PDF Report */}
          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="text-4xl">📄</div>
            <div className="text-left">
              <div className="font-bold text-lg">PDF-Report herunterladen</div>
              <div className="text-green-100 text-sm mt-1">Vollständige Analyse als PDF</div>
            </div>
            <div className="ml-auto text-2xl group-hover:translate-x-1 transition-transform">→</div>
          </button>

          {/* Beratung anfragen */}
          <a
            href="https://www.partflow.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="text-4xl">📞</div>
            <div>
              <div className="font-bold text-lg">Beratung bei Partflow anfragen</div>
              <div className="text-gray-300 text-sm mt-1">Kostenlos & unverbindlich</div>
            </div>
            <div className="ml-auto text-2xl group-hover:translate-x-1 transition-transform">→</div>
          </a>
        </div>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        title="📊 Ihr RFQ Triage Report"
      />

      {/* Response Template Modal */}
      {showResponseModal && responseTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold">✍️ KI-generierter Antwort-Entwurf</h3>
              <button onClick={() => setShowResponseModal(false)} className="text-white hover:text-blue-200 text-2xl font-bold">×</button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{responseTemplate}</pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(responseTemplate)
                    alert('Text in Zwischenablage kopiert!')
                  }}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  📋 In Zwischenablage kopieren
                </button>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Schließen
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                KI-Entwurf — bitte vor dem Versand sorgfältig prüfen und anpassen
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
