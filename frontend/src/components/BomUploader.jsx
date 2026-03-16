import { useState } from 'react'
import { parseBomFile } from '../utils/bomParser'

export default function BomUploader({ onFileProcessed }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [showFormatGuide, setShowFormatGuide] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e) => {
    const files = e.target.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file) => {
    setIsProcessing(true)
    setError(null)

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Datei ist zu groß. Maximale Größe: 10MB')
      }
      const result = await parseBomFile(file)
      onFileProcessed({
        fileName: file.name,
        fileSize: file.size,
        ...result
      })
    } catch (err) {
      setError(err.message)
      console.error('File processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 text-purple-600 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">BOM Risk Sentinel</h2>
        <p className="text-gray-600 text-lg mb-2">
          Laden Sie Ihre Stückliste hoch - <span className="font-bold text-purple-600">Automatische Spaltenerkennung</span>
        </p>
        <p className="text-sm text-gray-500">
          Excel (.xlsx, .xls) • CSV (.csv) • Max. 10MB
        </p>
      </div>

      {/* Format Flexibility Message */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-purple-900 text-lg mb-2">✨ Flexible BOM-Erkennung</h3>
            <p className="text-purple-800 mb-2">
              Upload Ihre Stückliste als <strong>Excel oder CSV</strong> - unsere intelligente Spaltenerkennung 
              mappt automatisch gängige Formate (SAP, ERP-Exports, Custom).
            </p>
            <p className="text-purple-700 text-sm mb-3">
              Unterstützt 30+ Spaltennamen-Varianten (DE/EN). Falls nötig können Sie im nächsten Schritt manuell nachbessern.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-purple-700 border border-purple-200">✓ Teilenummer</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-purple-700 border border-purple-200">✓ Beschreibung</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-purple-700 border border-purple-200">✓ Menge</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200">+ Lieferant (optional)</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200">+ Lead Time (optional)</span>
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200">+ Preis (optional)</span>
            </div>
            <button 
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="text-purple-600 hover:text-purple-800 font-semibold text-sm underline"
            >
              {showFormatGuide ? '▼ Format-Details ausblenden' : '▶ Format-Details & Templates anzeigen'}
            </button>
          </div>
        </div>
      </div>

      {/* Format Guide (Collapsible) */}
      {showFormatGuide && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-gray-900 text-lg mb-4">📋 BOM-Format Anforderungen</h3>
          
          {/* Download Templates */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900 mb-3">🎁 Beispiel-Templates herunterladen:</p>
            <div className="flex flex-wrap gap-3">
              <a 
                href="/samples/sample_bom_minimal.csv" 
                download
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Minimal-Template (CSV)
              </a>
              <a 
                href="/samples/sample_bom_complete.csv" 
                download
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Vollständig-Template (CSV)
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">💡 Nutzen Sie diese Templates als Vorlage oder laden Sie Ihr eigenes Format hoch</p>
          </div>

          {/* Field Requirements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Feld</th>
                  <th className="px-4 py-3 text-left font-semibold">Erforderlich?</th>
                  <th className="px-4 py-3 text-left font-semibold">Beispiele für Spaltennamen</th>
                  <th className="px-4 py-3 text-left font-semibold">Zweck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-semibold">Part Number</td>
                  <td className="px-4 py-3"><span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">REQUIRED</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Part#, Teilenummer, Item, Material, Artikelnr</td>
                  <td className="px-4 py-3 text-xs">Eindeutige Identifikation</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-semibold">Description</td>
                  <td className="px-4 py-3"><span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">REQUIRED</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Desc, Name, Bezeichnung, Title</td>
                  <td className="px-4 py-3 text-xs">Bauteil-Beschreibung</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-semibold">Quantity</td>
                  <td className="px-4 py-3"><span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">REQUIRED</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Qty, Menge, Amount, Q, Stück</td>
                  <td className="px-4 py-3 text-xs">Anzahl pro Einheit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Supplier</td>
                  <td className="px-4 py-3"><span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Optional</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Vendor, Lieferant, Manufacturer</td>
                  <td className="px-4 py-3 text-xs">Single-Source Risiko</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Lead Time</td>
                  <td className="px-4 py-3"><span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Optional</span></td>
                  <td className="px-4 py-3 font-mono text-xs">LT, Lieferzeit, Delivery Time</td>
                  <td className="px-4 py-3 text-xs">Vorlaufzeit-Analyse</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Unit Price</td>
                  <td className="px-4 py-3"><span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Optional</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Price, Preis, Cost, Stückpreis</td>
                  <td className="px-4 py-3 text-xs">ROI-Berechnung</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Annual Volume</td>
                  <td className="px-4 py-3"><span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Optional</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Jahresvolumen, Volume, Usage</td>
                  <td className="px-4 py-3 text-xs">Kosten-Impact</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Lifecycle Status</td>
                  <td className="px-4 py-3"><span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Optional</span></td>
                  <td className="px-4 py-3 font-mono text-xs">Status, LC, Active, EOL</td>
                  <td className="px-4 py-3 text-xs">Obsoleszenz-Risiko</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Tipp:</strong> Je mehr Felder Sie ausfüllen, desto genauer wird die Risiko-Analyse. 
              Die 3 Required-Felder genügen aber für eine erste Einschätzung!
            </p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-3 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-25'
          }
        `}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p className="text-lg font-semibold text-gray-700">Verarbeite BOM-Datei...</p>
            <p className="text-sm text-gray-500">Spalten werden automatisch erkannt...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-700 mb-2">BOM-Datei hier ablegen</p>
              <p className="text-gray-500 mb-4">oder</p>
              <label className="cursor-pointer">
                <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all inline-block">
                  📁 Datei auswählen
                </span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Fehler beim Verarbeiten</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="text-purple-600 font-bold text-lg mb-2">📊 6-Faktoren Risiko-Analyse</div>
          <p className="text-gray-600 text-sm">
            Lieferanten-Diversität • Lead Time • Kritikalität • Kosten-Impact • Obsoleszenz • Änderungshäufigkeit
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="text-purple-600 font-bold text-lg mb-2">🎯 Automatische Priorisierung</div>
          <p className="text-gray-600 text-sm">
            Top 10 kritische Bauteile mit konkreten Handlungsempfehlungen und priorisierten Maßnahmen
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="text-purple-600 font-bold text-lg mb-2">💰 ROI-Berechnung</div>
          <p className="text-gray-600 text-sm">
            Kosten der Untätigkeit vs. Mitigations-Kosten mit Einsparpotenzialen und Business Case
          </p>
        </div>
      </div>
    </div>
  )
}
