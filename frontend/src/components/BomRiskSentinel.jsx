import { useState } from 'react'
import BomUploader from './BomUploader'
import BomDataMapper from './BomDataMapper'
import BomRiskDashboard from './BomRiskDashboard'
import { generateBomRiskPDF } from '../utils/bomPdfGenerator'

export default function BomRiskSentinel() {
  const [step, setStep] = useState('upload') // 'upload', 'mapping', 'dashboard'
  const [fileData, setFileData] = useState(null)
  const [bomData, setBomData] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleFileProcessed = (data) => {
    setFileData(data)
    setStep('mapping')
  }

  const handleMappingComplete = (data) => {
    setFileName(data.fileName)
    setBomData(data.bomData)
    setStep('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setStep('upload')
    setFileData(null)
    setBomData(null)
    setFileName('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToUpload = () => {
    setStep('upload')
    setFileData(null)
  }

  const handleDownloadPDF = async (reportData) => {
    try {
      const result = await generateBomRiskPDF(reportData)
      if (result.success) {
        // Success notification (optional: you could add a toast notification here)
        console.log(`✅ PDF created successfully: ${result.fileName} (${result.pages} pages)`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Fehler beim Erstellen des PDF-Reports: ' + error.message)
    }
  }

  return (
    <div className="py-12 px-4">
      {step === 'upload' && (
        <BomUploader onFileProcessed={handleFileProcessed} />
      )}

      {step === 'mapping' && (
        <BomDataMapper
          fileData={fileData}
          onMappingComplete={handleMappingComplete}
          onBack={handleBackToUpload}
        />
      )}

      {step === 'dashboard' && (
        <BomRiskDashboard
          bomData={bomData}
          fileName={fileName}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
