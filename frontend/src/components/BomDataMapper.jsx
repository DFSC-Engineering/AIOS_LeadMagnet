import { useState, useEffect } from 'react'
import { autoDetectColumns, validateBomData, transformBomData, enrichBomData } from '../utils/bomParser'

export default function BomDataMapper({ fileData, onMappingComplete, onBack }) {
  const [columnMapping, setColumnMapping] = useState({})
  const [validation, setValidation] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const autoMapping = autoDetectColumns(fileData.columns)
    setColumnMapping(autoMapping)
    const validationResult = validateBomData(fileData.data, autoMapping)
    setValidation(validationResult)
  }, [fileData])

  const handleColumnChange = (field, column) => {
    const newMapping = { ...columnMapping, [field]: column === '' ? null : column }
    setColumnMapping(newMapping)
    const validationResult = validateBomData(fileData.data, newMapping)
    setValidation(validationResult)
  }

  const handleConfirm = () => {
    if (!validation?.isValid) return
    setIsProcessing(true)
    try {
      const transformedData = transformBomData(fileData.data, columnMapping)
      const enrichedData = enrichBomData(transformedData)
      onMappingComplete({ bomData: enrichedData, mapping: columnMapping, fileName: fileData.fileName })
    } catch (error) {
      console.error('Data transformation error:', error)
      alert('Fehler beim Verarbeiten der Daten: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const fieldLabels = {
    partNumber: { label: 'Part Number', required: true, icon: '🔢' },
    description: { label: 'Description', required: true, icon: '📝' },
    quantity: { label: 'Quantity', required: true, icon: '📦' },
    supplier: { label: 'Supplier', required: false, icon: '🏭' },
    leadTime: { label: 'Lead Time (weeks)', required: false, icon: '⏱️' },
    unitPrice: { label: 'Unit Price', required: false, icon: '💰' },
    annualVolume: { label: 'Annual Volume', required: false, icon: '📊' },
    lifecycleStatus: { label: 'Lifecycle Status', required: false, icon: '🔄' },
    category: { label: 'Category', required: false, icon: '🏷️' },
    lastChangeDate: { label: 'Last Change Date', required: false, icon: '📅' }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Spalten-Mapping bestätigen</h2>
          <p className="text-gray-600">
            Datei: <span className="font-semibold">{fileData.fileName}</span> • {fileData.rowCount} Zeilen
          </p>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800 font-semibold">← Zurück</button>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-blue-800">Automatische Spaltenerkennung aktiv</p>
            <p className="text-blue-700 text-sm">Wir haben Ihre Spalten automatisch zugeordnet. Bitte überprüfen Sie die Zuordnung.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {Object.entries(fieldLabels).map(([field, { label, required, icon }]) => (
          <div key={field} className="flex items-center gap-4">
            <div className="w-1/3">
              <label className="block font-semibold text-gray-700">
                {icon} {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            <div className="w-2/3">
              <select
                value={columnMapping[field] || ''}
                onChange={(e) => handleColumnChange(field, e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  ${required && !columnMapping[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">-- Nicht zugeordnet --</option>
                {fileData.columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {validation && (
        <div className="mb-8">
          {validation.isValid ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-800">Mapping gültig ✓</p>
                  <p className="text-green-700 text-sm">{validation.stats.validRows} von {validation.stats.totalRows} Zeilen können verarbeitet werden</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 mb-2">Validierungsfehler</p>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {validation.errors.map((error, idx) => <li key={idx}>{error}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-4">📋 Daten-Vorschau (erste 5 Zeilen)</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {Object.entries(fieldLabels).filter(([field]) => columnMapping[field]).map(([field, { label }]) => (
                  <th key={field} className="px-4 py-3 text-left font-semibold text-gray-700">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fileData.data.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  {Object.entries(fieldLabels).filter(([field]) => columnMapping[field]).map(([field]) => (
                    <td key={field} className="px-4 py-3 text-gray-600">{row[columnMapping[field]] || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Zeige 5 von {fileData.rowCount} Zeilen</p>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all">
          ← Andere Datei hochladen
        </button>
        <button
          onClick={handleConfirm}
          disabled={!validation?.isValid || isProcessing}
          className={`px-8 py-3 rounded-lg font-bold text-white transition-all
            ${validation?.isValid && !isProcessing ? 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          {isProcessing ? '🔄 Verarbeite...' : '🚀 Risiko-Analyse starten'}
        </button>
      </div>
    </div>
  )
}
