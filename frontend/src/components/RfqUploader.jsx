import { useState, useRef } from 'react'
import { parseBomFile } from '../utils/bomParser'

const EXAMPLE_RFQ = `Sehr geehrte Damen und Herren,

wir bitten um Ihr Angebot für folgende Bauteile:

Pos. 1: Welle, Ø 40mm, Länge 250mm, Material: 42CrMo4, Toleranz h6, Menge: 20 Stück
Pos. 2: Flansch DIN 2633 DN50 PN16, Material: S235JR, Menge: 8 Stück
Pos. 3: Buchse Ø 60/40 x 80mm, Material: CuSn8, Menge: 4 Stück

Angebotsfrist: 15.04.2025
Liefertermin: KW 22/2025
Lieferort: Werk Kaiserslautern

Mit freundlichen Grüßen
Max Mustermann
Musterfirma GmbH`

export default function RfqUploader({ onAnalyze }) {
  const [activeTab, setActiveTab] = useState('pdf')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // PDF state
  const [pdfFile, setPdfFile] = useState(null)

  // Text state
  const [rfqText, setRfqText] = useState('')

  // BOM state
  const [bomFile, setBomFile] = useState(null)
  const [bomData, setBomData] = useState(null)

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handlePdfDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await handlePdfFile(file)
  }

  const handlePdfFile = async (file) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Bitte eine PDF-Datei hochladen.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Datei zu groß (max. 20MB)')
      return
    }
    setPdfFile(file)
    setError(null)
  }

  const handleBomFile = async (file) => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await parseBomFile(file)
      setBomFile(file)
      setBomData(result.data)
    } catch (err) {
      setError(`BOM-Parsing fehlgeschlagen: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAnalyze = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      let payload

      if (activeTab === 'pdf') {
        if (!pdfFile) { setError('Bitte zuerst eine PDF-Datei hochladen.'); setIsProcessing(false); return }
        const base64 = await fileToBase64(pdfFile)
        payload = { inputType: 'pdf', content: { pdfBase64: base64 } }
      } else if (activeTab === 'text') {
        if (!rfqText.trim()) { setError('Bitte Anfrage-Text eingeben.'); setIsProcessing(false); return }
        payload = { inputType: 'text', content: { text: rfqText } }
      } else {
        if (!bomData) { setError('Bitte zuerst eine BOM-Datei hochladen.'); setIsProcessing(false); return }
        payload = { inputType: 'bom', content: { bomData: bomData.slice(0, 50) } }
      }

      onAnalyze(payload)
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const canAnalyze = (activeTab === 'pdf' && pdfFile) ||
    (activeTab === 'text' && rfqText.trim().length > 20) ||
    (activeTab === 'bom' && bomData)

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 text-orange-600 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">RFQ Triage Agent</h2>
        <p className="text-gray-600 text-lg mb-2">
          Laden Sie eine Anfrage hoch — <span className="font-bold text-orange-600">KI-Analyse in Sekunden</span>
        </p>
        <p className="text-sm text-gray-500">
          PDF-Dokument • Text-Eingabe • Stückliste (Excel/CSV)
        </p>
      </div>

      {/* Value Prop Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600 mb-1">5 Min</div>
            <div className="text-sm text-gray-700">statt 2-4h manuelle Analyse</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 mb-1">GO/NO-GO</div>
            <div className="text-sm text-gray-700">KI-Entscheidungsempfehlung</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 mb-1">24h</div>
            <div className="text-sm text-gray-700">Beschaffung via Partflow</div>
          </div>
        </div>
      </div>

      {/* Input Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pdf', label: '📄 PDF hochladen', desc: 'RFQ als Dokument' },
          { id: 'text', label: '✏️ Text einfügen', desc: 'E-Mail / Freitext' },
          { id: 'bom', label: '📊 Stückliste', desc: 'Excel / CSV' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(null) }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div>{tab.label}</div>
            <div className={`text-xs mt-0.5 ${activeTab === tab.id ? 'text-orange-100' : 'text-gray-400'}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* PDF Tab */}
      {activeTab === 'pdf' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handlePdfDrop}
          className={`border-3 border-dashed rounded-xl p-10 text-center transition-all ${
            isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:border-orange-400'
          }`}
        >
          {pdfFile ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{pdfFile.name}</p>
                <p className="text-gray-500 text-sm">{(pdfFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setPdfFile(null)}
                className="text-sm text-gray-500 hover:text-red-500 underline"
              >
                Andere Datei wählen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">PDF hier ablegen</p>
                <p className="text-gray-500 mb-4">oder</p>
                <label className="cursor-pointer">
                  <span className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all inline-block">
                    📄 PDF auswählen
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files[0] && handlePdfFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400">PDF bis 20MB • Technische Zeichnungen, Ausschreibungen, Anfragedokumente</p>
            </div>
          )}
        </div>
      )}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700">Anfrage-Text einfügen</label>
            <button
              onClick={() => setRfqText(EXAMPLE_RFQ)}
              className="text-xs text-orange-600 hover:text-orange-800 underline font-medium"
            >
              Beispiel laden
            </button>
          </div>
          <textarea
            value={rfqText}
            onChange={(e) => setRfqText(e.target.value)}
            placeholder="Fügen Sie hier den Text der Anfrage ein — E-Mail, Fax-Inhalt, Ausschreibungstext..."
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-mono resize-y"
          />
          <p className="text-xs text-gray-400 text-right">{rfqText.length} Zeichen</p>
        </div>
      )}

      {/* BOM Tab */}
      {activeTab === 'bom' && (
        <div>
          <div className="border-3 border-dashed rounded-xl p-8 text-center border-gray-300 bg-gray-50 hover:border-orange-400 transition-all">
            {isProcessing ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
                <p className="font-semibold text-gray-700">Stückliste wird verarbeitet...</p>
              </div>
            ) : bomFile ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 text-green-600 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{bomFile.name}</p>
                  <p className="text-gray-500 text-sm">{bomData?.length || 0} Zeilen erkannt</p>
                </div>
                <button
                  onClick={() => { setBomFile(null); setBomData(null) }}
                  className="text-sm text-gray-500 hover:text-red-500 underline"
                >
                  Andere Datei wählen
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-700 mb-3">Stückliste als Excel oder CSV hochladen</p>
                  <label className="cursor-pointer">
                    <span className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all inline-block">
                      📊 Datei auswählen
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => e.target.files[0] && handleBomFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Excel (.xlsx, .xls) • CSV (.csv) • Automatische Spaltenerkennung</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isProcessing}
          className={`px-12 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform ${
            canAnalyze && !isProcessing
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white hover:scale-105 hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          🤖 Jetzt KI-Analyse starten
        </button>
        <p className="text-xs text-gray-400 mt-3">
          ✓ Powered by Claude AI • ✓ Ihre Daten bleiben privat • ✓ Kostenlos
        </p>
      </div>
    </div>
  )
}
