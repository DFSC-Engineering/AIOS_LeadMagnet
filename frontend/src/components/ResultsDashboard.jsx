import { useState } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { formatCurrency, formatPercent } from '../utils/calculations'
import { generatePDF } from '../utils/pdfGenerator'
import LeadCaptureModal from './LeadCaptureModal'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function ResultsDashboard({ results, onReset }) {
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const {
    totalCostOfFriction,
    frictionAsPercentOfRevenue,
    annualRevenue,
    targetMargin,
    potentialMarginGain,
    newMargin,
    breakdown,
    recommendations,
    roi
  } = results

  const handleDownloadPDF = () => {
    setShowLeadModal(true)
  }

  const handleLeadSubmit = (leadData) => {
    // Generate and download PDF
    generatePDF(results, leadData)
    
    // Close modal and show success message
    setShowLeadModal(false)
    setShowSuccessMessage(true)
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)
  }

  // Prepare data for Pie Chart
  const pieData = {
    labels: Object.values(breakdown).map(item => item.label),
    datasets: [{
      data: Object.values(breakdown).map(item => item.value),
      backgroundColor: Object.values(breakdown).map(item => item.color),
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
            family: 'Inter'
          },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = formatCurrency(context.parsed)
            const percent = formatPercent(context.parsed / totalCostOfFriction * 100)
            return `${label}: ${value} (${percent})`
          }
        }
      }
    }
  }

  // Prepare data for Bar Chart (Recommendations)
  const barData = {
    labels: recommendations.map(r => r.cluster),
    datasets: [{
      label: 'Jährliche Kosten',
      data: recommendations.map(r => r.cost),
      backgroundColor: recommendations.map((_, index) => 
        Object.values(breakdown)[index].color
      ),
      borderRadius: 8,
    }]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y)
          }
        }
      }
    }
  }

  return (
    <div id="results-section" className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-2xl p-8 text-white fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Ihre Cost of Friction Analyse
            </h2>
            <p className="text-primary-100 text-lg">
              Entdecken Sie versteckte Potenziale in Ihrer Wertschöpfungskette
            </p>
          </div>
          <button
            onClick={onReset}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ← Neue Berechnung
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 fade-in flex items-start gap-4">
          <div className="text-4xl">🎉</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-900 mb-2">
              Vielen Dank! Ihr Report wurde heruntergeladen.
            </h3>
            <p className="text-green-800">
              Einer unserer Experten wird sich in Kürze bei Ihnen melden, um Ihre spezifischen 
              Herausforderungen zu besprechen und individuelle Lösungen zu präsentieren.
            </p>
            <p className="text-sm text-green-700 mt-3">
              In der Zwischenzeit können Sie sich gerne auf <a href="https://www.partflow.net" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Partflow.net</a> umsehen.
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Total Cost of Friction
            </h3>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-2">
            {formatCurrency(totalCostOfFriction)}
          </p>
          <p className="text-sm text-gray-600">
            {formatPercent(frictionAsPercentOfRevenue, 2)} vom Jahresumsatz
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Margenpotenzial
            </h3>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-green-600 mb-2">
            +{formatPercent(potentialMarginGain, 2)}
          </p>
          <p className="text-sm text-gray-600">
            Von {formatPercent(targetMargin, 1)} auf {formatPercent(newMargin, 1)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              ROI mit Partflow
            </h3>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-primary-600 mb-2">
            {roi.roiMonths} Monate
          </p>
          <p className="text-sm text-gray-600">
            ROI: {roi.roiPercent}% im ersten Jahr
          </p>
        </div>
      </div>

      {/* PDF Download Button - PROMINENT */}
      <div className="flex flex-col items-center fade-in bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🎯 Ihre Analyse ist fertig!
          </h3>
          <p className="text-gray-600 text-lg">
            Laden Sie jetzt Ihren detaillierten Cost of Friction Report herunter
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-5 px-12 rounded-xl shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-110 flex items-center gap-4 text-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          📄 Jetzt PDF-Report herunterladen
        </button>
        <p className="text-sm text-gray-500 mt-4">
          ✓ Detaillierte Kostenaufschlüsselung • ✓ Priorisierte Handlungsempfehlungen • ✓ ROI-Projektion
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Kostenprofil nach Symptom-Clustern
          </h3>
          <div className="h-80">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Priorisierung nach Impact
          </h3>
          <div className="h-80">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-8 fade-in">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Detaillierte Kostenanalyse
        </h3>
        
        <div className="space-y-6">
          {Object.entries(breakdown).map(([key, data]) => (
            <div key={key} className="border-l-4 pl-6 py-4" style={{ borderColor: data.color }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{data.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPercent(data.percent, 1)} der Gesamtkosten
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: data.color }}>
                    {formatCurrency(data.value)}
                  </p>
                  <p className="text-sm text-gray-600">pro Jahr</p>
                </div>
              </div>
              
              {/* Sub-details */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                {Object.entries(data.details).map(([detailKey, detailValue]) => (
                  <div key={detailKey} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600 capitalize">
                      {detailKey.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatCurrency(detailValue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-8 fade-in">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Priorisierte Handlungsempfehlungen
        </h3>
        
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const clusterKey = Object.keys(breakdown).find(
              key => breakdown[key].label === rec.cluster
            )
            const solution = breakdown[clusterKey]?.label
            const solutionDetails = rec.solution

            return (
              <div 
                key={rec.priority} 
                className="border-2 rounded-xl p-6 hover:shadow-lg transition-shadow"
                style={{ borderColor: breakdown[clusterKey].color }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: breakdown[clusterKey].color }}
                  >
                    {rec.priority}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {rec.cluster}
                    </h4>
                    <div className="flex gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Jährliche Kosten</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(rec.cost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Impact</p>
                        <p className="text-lg font-bold" style={{ color: breakdown[clusterKey].color }}>
                          {formatPercent(rec.impact, 1)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Solution Box */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">
                            💡 {solutionDetails.title}
                          </p>
                          <p className="text-sm text-gray-700 mb-3">
                            {solutionDetails.description}
                          </p>
                        </div>
                      </div>
                      <a
                        href={solutionDetails.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm"
                      >
                        {solutionDetails.action} →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ROI Projection */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-2 border-green-200 fade-in">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          📊 ROI-Projektion mit Partflow.net
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Geschätzte Einsparungen</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(roi.estimatedAnnualSavings)}
            </p>
            <p className="text-sm text-gray-600 mt-1">pro Jahr (70% Reduktion)</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Amortisationsdauer</p>
            <p className="text-3xl font-bold text-primary-600">
              {roi.roiMonths} Monate
            </p>
            <p className="text-sm text-gray-600 mt-1">Setup-Kosten: {formatCurrency(roi.setupCost)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Warum Partflow.net?
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>24h Angebotszeit</strong> statt 5-15 Tage Wartezeit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Ein Ansprechpartner</strong> statt 5+ Lieferanten</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>Direkte CAD-Integration</strong> eliminiert manuelles Abtippen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>200+ ISO-zertifizierte Partner</strong> in 12 europäischen Ländern</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              <span><strong>15-30% Kosteneinsparungen</strong> durch optimierte Beschaffung</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
      />

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-2xl p-12 text-center text-white fade-in">
        <h3 className="text-3xl font-bold mb-4">
          Bereit, Ihre Margen zu optimieren?
        </h3>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Sprechen Sie mit unseren Experten und erfahren Sie, wie wir Ihre spezifischen 
          Herausforderungen lösen können.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://www.partflow.net"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all inline-block"
          >
            Partflow.net kostenlos testen →
          </a>
          <a
            href="https://www.dfsc-engineering.de"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-700 hover:bg-primary-800 px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all inline-block border-2 border-white"
          >
            DFSC Beratung anfragen
          </a>
        </div>

        <p className="mt-8 text-sm text-primary-200">
          📞 +49 6331 7296114 | ✉️ info@dfsc-engineering.de
        </p>
      </div>
    </div>
  )
}
