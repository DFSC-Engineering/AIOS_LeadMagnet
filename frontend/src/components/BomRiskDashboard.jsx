import { useState } from 'react'
import { calculateBomRisk, formatCurrency } from '../utils/riskCalculations'
import LeadCaptureModal from './LeadCaptureModal'
import { generateBomRiskPDF } from '../utils/bomPdfGenerator'

export default function BomRiskDashboard({ bomData, fileName, onReset }) {
  const [selectedPart, setSelectedPart] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  const riskAnalysis = calculateBomRisk(bomData)
  const { assessments, stats, recommendations } = riskAnalysis
  const top10Critical = assessments.slice(0, 10)

  const handleLeadSubmit = async (leadData) => {
    await generateBomRiskPDF({ assessments, stats, recommendations, fileName })
    setShowLeadModal(false)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 5000)
  }

  const getRiskBadgeColor = (category) => {
    switch (category) {
      case 'CRITICAL': return 'bg-red-600 text-white'
      case 'HIGH': return 'bg-orange-500 text-white'
      case 'MEDIUM': return 'bg-yellow-500 text-white'
      case 'LOW': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 BOM Risk Assessment</h2>
            <p className="text-gray-600">
              Datei: <span className="font-semibold">{fileName}</span> • {stats.totalParts} Bauteile analysiert
            </p>
          </div>
          <button onClick={onReset} className="text-gray-600 hover:text-gray-800 font-semibold">← Neue Analyse</button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
            <div className="text-red-600 text-sm font-semibold mb-2">Durchschnittlicher Risk Score</div>
            <div className="text-4xl font-bold text-red-700">{stats.avgRiskScore}</div>
            <div className="text-red-600 text-xs mt-2">von 100 Punkten</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
            <div className="text-orange-600 text-sm font-semibold mb-2">Kritische Bauteile</div>
            <div className="text-4xl font-bold text-orange-700">{stats.byCategory.CRITICAL + stats.byCategory.HIGH}</div>
            <div className="text-orange-600 text-xs mt-2">{stats.byCategory.CRITICAL} CRITICAL • {stats.byCategory.HIGH} HIGH</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
            <div className="text-purple-600 text-sm font-semibold mb-2">Geschätzte Risiko-Kosten</div>
            <div className="text-3xl font-bold text-purple-700">{formatCurrency(stats.totalCostOfInaction)}</div>
            <div className="text-purple-600 text-xs mt-2">pro Jahr (wenn unbehandelt)</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
            <div className="text-green-600 text-sm font-semibold mb-2">ROI der Maßnahmen</div>
            <div className="text-4xl font-bold text-green-700">{stats.overallROI}</div>
            <div className="text-green-600 text-xs mt-2">Return on Investment</div>
          </div>
        </div>
      </div>

      {/* Key Issues */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">🚨 Kritische Problembereiche</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-700 mb-2">{stats.keyIssues.singleSourceParts}</div>
            <div className="text-red-800 font-semibold">Single-Source Bauteile</div>
            <div className="text-red-600 text-sm mt-2">Nur ein Lieferant - Hohes Ausfallrisiko</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
            <div className="text-3xl font-bold text-orange-700 mb-2">{stats.keyIssues.longLeadTimeParts}</div>
            <div className="text-orange-800 font-semibold">Lange Lieferzeiten</div>
            <div className="text-orange-600 text-sm mt-2">Bauteile mit &gt;12 Wochen Lead Time</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-700 mb-2">{stats.keyIssues.eolParts}</div>
            <div className="text-purple-800 font-semibold">EOL / Abgekündigt</div>
            <div className="text-purple-600 text-sm mt-2">Bauteile nicht mehr verfügbar</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Priorisierte Handlungsempfehlungen</h3>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`rounded-lg p-6 border-l-4 ${
              rec.impact === 'CRITICAL' ? 'bg-red-50 border-red-500' :
              rec.impact === 'HIGH' ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50 border-yellow-500'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  rec.impact === 'CRITICAL' ? 'bg-red-600 text-white' :
                  rec.impact === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {rec.priority}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{rec.title}</h4>
                  <p className="text-gray-700 mb-2">{rec.description}</p>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <span className="font-semibold text-gray-900">Maßnahme: </span>
                    <span className="text-gray-700">{rec.action}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Critical Parts */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">🔝 Top 10 Kritische Bauteile</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Part Number</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Risk Score</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cost Impact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {top10Critical.map((part) => (
                <tr key={part.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-4 font-semibold text-gray-900">{part.priority}</td>
                  <td className="px-4 py-4 font-mono text-sm text-gray-700">{part.partNumber}</td>
                  <td className="px-4 py-4 text-gray-700">{part.description}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-2xl text-gray-900">{part.riskScore}</div>
                      <div className="text-xs text-gray-500">/100</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeColor(part.riskCategory)}`}>
                      {part.riskCategory}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{formatCurrency(part.estimatedCostOfInaction)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { setSelectedPart(part); setShowDetails(true); }}
                      className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 flex items-start gap-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Report heruntergeladen!</h3>
            <p className="text-green-800">Unser Team meldet sich in Kürze für ein unverbindliches Gespräch.</p>
            <a href="https://www.partflow.net" target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-semibold text-sm mt-1 block">
              Jetzt auf Partflow.net →
            </a>
          </div>
        </div>
      )}

      {/* PDF Download Button */}
      <div className="flex flex-col items-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-4 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">🎯 Ihr BOM Risk Assessment ist fertig!</h3>
          <p className="text-gray-600 text-lg">Laden Sie jetzt Ihren detaillierten Risk Report herunter</p>
        </div>
        <button
          onClick={() => setShowLeadModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-5 px-12 rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-110 flex items-center gap-4 text-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          📄 Jetzt PDF-Report herunterladen
        </button>
        <p className="text-sm text-gray-500 mt-4">
          ✓ Detaillierte Risiko-Analyse • ✓ Top 10 kritische Bauteile • ✓ Priorisierte Maßnahmen • ✓ ROI-Berechnung
        </p>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        title="🎯 Ihr BOM Risk Assessment Report"
      />

      {/* Part Details Modal */}
      {showDetails && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Detailanalyse</h3>
                <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Part Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 font-semibold">Part Number:</span>
                    <div className="font-mono text-lg">{selectedPart.partNumber}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Risk Score:</span>
                    <div className="text-2xl font-bold text-red-600">{selectedPart.riskScore}/100</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 font-semibold">Description:</span>
                    <div>{selectedPart.description}</div>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-4">
                {Object.entries(selectedPart.riskFactors).map(([factor, data]) => (
                  <div key={factor} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        data.level === 'HIGH' ? 'bg-red-500 text-white' :
                        data.level === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {data.level}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{data.recommendation}</div>
                    <div className="bg-gray-100 rounded p-2 text-sm">
                      Score: <span className="font-bold">{data.score}/100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Analysis */}
              <div className="mt-6 bg-purple-50 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-4">💰 Kosten-Analyse</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-600 text-sm">Cost of Inaction</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedPart.estimatedCostOfInaction)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm">Mitigation Cost</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedPart.estimatedMitigationCost)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-600 text-sm">ROI</div>
                    <div className="text-3xl font-bold text-purple-600">{selectedPart.roi}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
