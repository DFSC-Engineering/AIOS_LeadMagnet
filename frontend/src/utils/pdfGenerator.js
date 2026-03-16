import jsPDF from 'jspdf'
import { formatCurrency, formatPercent } from './calculations'

export function generatePDF(results, leadData) {
  const doc = new jsPDF()
  
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

  // Colors (matching Partflow branding)
  const primaryColor = [0, 188, 212] // Türkis
  const darkGray = [33, 33, 33]
  const lightGray = [120, 120, 120]

  // Header with Logo placeholder
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('AI Business OS', 15, 20)
  
  doc.setFontSize(10)
  doc.text('Cost of Friction Analyse', 15, 28)
  doc.text('Powered by DFSC Engineering & Partflow.net', 15, 34)

  // Contact Info (top right)
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(`Erstellt für: ${leadData.firstname} ${leadData.lastName}`, 210 - 15, 15, { align: 'right' })
  doc.text(`${leadData.company_name}`, 210 - 15, 20, { align: 'right' })
  doc.text(`${new Date().toLocaleDateString('de-DE')}`, 210 - 15, 25, { align: 'right' })

  // Main Results
  let y = 50

  doc.setTextColor(...darkGray)
  doc.setFontSize(18)
  doc.text('Ihre Ergebnisse im Überblick', 15, y)
  y += 10

  // Key Metrics Box
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(15, y, 180, 45, 3, 3, 'F')
  y += 8

  // Total Cost
  doc.setFontSize(10)
  doc.setTextColor(...lightGray)
  doc.text('TOTAL COST OF FRICTION', 20, y)
  y += 7
  doc.setFontSize(20)
  doc.setTextColor(...primaryColor)
  doc.text(formatCurrency(totalCostOfFriction), 20, y)
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text(`${formatPercent(frictionAsPercentOfRevenue, 2)} vom Jahresumsatz`, 20, y + 5)
  y += 15

  // Margin Potential
  doc.setFontSize(10)
  doc.text('MARGENPOTENZIAL', 20, y)
  y += 7
  doc.setFontSize(16)
  doc.setTextColor(76, 175, 80) // Green
  doc.text(`+${formatPercent(potentialMarginGain, 2)}`, 20, y)
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text(`Von ${formatPercent(targetMargin, 1)} auf ${formatPercent(newMargin, 1)}`, 20, y + 5)

  // ROI
  doc.setFontSize(10)
  doc.text('ROI MIT PARTFLOW', 120, y - 12)
  y += 7
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.text(`${roi.roiMonths} Monate`, 120, y - 12)
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text(`${roi.roiPercent}% im ersten Jahr`, 120, y - 7)

  y += 20

  // Breakdown by Cluster
  doc.setFontSize(16)
  doc.setTextColor(...darkGray)
  doc.text('Kostenprofil nach Symptom-Clustern', 15, y)
  y += 10

  Object.entries(breakdown).forEach(([key, data]) => {
    doc.setFillColor(250, 250, 250)
    doc.roundedRect(15, y, 180, 18, 2, 2, 'F')
    
    // Color indicator
    const [r, g, b] = hexToRgb(data.color)
    doc.setFillColor(r, g, b)
    doc.rect(15, y, 4, 18, 'F')
    
    // Label
    doc.setFontSize(11)
    doc.setTextColor(...darkGray)
    doc.text(data.label, 22, y + 8)
    
    // Amount
    doc.setFontSize(12)
    doc.setTextColor(r, g, b)
    doc.text(formatCurrency(data.value), 195, y + 8, { align: 'right' })
    
    // Percentage
    doc.setFontSize(9)
    doc.setTextColor(...lightGray)
    doc.text(`${formatPercent(data.percent, 1)}`, 195, y + 14, { align: 'right' })
    
    y += 22
  })

  // New Page for Recommendations
  doc.addPage()
  y = 20

  doc.setFontSize(18)
  doc.setTextColor(...darkGray)
  doc.text('Priorisierte Handlungsempfehlungen', 15, y)
  y += 10

  recommendations.forEach((rec, index) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    const clusterKey = Object.keys(breakdown).find(
      key => breakdown[key].label === rec.cluster
    )
    const [r, g, b] = hexToRgb(breakdown[clusterKey].color)

    // Priority Badge
    doc.setFillColor(r, g, b)
    doc.circle(20, y + 5, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text(rec.priority.toString(), 20, y + 7, { align: 'center' })

    // Title
    doc.setTextColor(...darkGray)
    doc.setFontSize(13)
    doc.text(rec.cluster, 30, y + 7)
    y += 12

    // Details
    doc.setFontSize(9)
    doc.setTextColor(...lightGray)
    doc.text(`Jährliche Kosten: ${formatCurrency(rec.cost)} | Impact: ${formatPercent(rec.impact, 1)}`, 30, y)
    y += 8

    // Solution
    doc.setFillColor(245, 250, 245)
    doc.roundedRect(30, y, 165, 25, 2, 2, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.text(`💡 ${rec.solution.title}`, 35, y + 6)
    
    doc.setFontSize(8)
    doc.setTextColor(...lightGray)
    const descLines = doc.splitTextToSize(rec.solution.description, 155)
    doc.text(descLines, 35, y + 12)
    
    y += 35
  })

  // ROI Projection Page
  doc.addPage()
  y = 20

  doc.setFontSize(18)
  doc.setTextColor(...darkGray)
  doc.text('ROI-Projektion mit Partflow.net', 15, y)
  y += 15

  // ROI Box
  doc.setFillColor(232, 245, 233)
  doc.roundedRect(15, y, 180, 60, 3, 3, 'F')
  y += 10

  doc.setFontSize(11)
  doc.setTextColor(...darkGray)
  doc.text('Geschätzte Einsparungen pro Jahr', 20, y)
  y += 7
  doc.setFontSize(18)
  doc.setTextColor(76, 175, 80)
  doc.text(formatCurrency(roi.estimatedAnnualSavings), 20, y)
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text('(70% Reduktion der Cost of Friction)', 20, y + 5)
  y += 15

  doc.setFontSize(11)
  doc.setTextColor(...darkGray)
  doc.text('Amortisationsdauer', 20, y)
  y += 7
  doc.setFontSize(18)
  doc.setTextColor(...primaryColor)
  doc.text(`${roi.roiMonths} Monate`, 20, y)
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text(`Setup-Kosten: ${formatCurrency(roi.setupCost)}`, 20, y + 5)
  y += 20

  // Benefits
  y += 10
  doc.setFontSize(13)
  doc.setTextColor(...darkGray)
  doc.text('Warum Partflow.net?', 15, y)
  y += 8

  const benefits = [
    '✓ 24h Angebotszeit statt 5-15 Tage Wartezeit',
    '✓ Ein Ansprechpartner statt 5+ Lieferanten',
    '✓ Direkte CAD-Integration eliminiert manuelles Abtippen',
    '✓ 200+ ISO-zertifizierte Partner in 12 europäischen Ländern',
    '✓ 15-30% Kosteneinsparungen durch optimierte Beschaffung',
    '✓ 40% schnellere Lieferung vs. traditionelle Prozesse'
  ]

  doc.setFontSize(9)
  doc.setTextColor(...darkGray)
  benefits.forEach(benefit => {
    doc.text(benefit, 20, y)
    y += 6
  })

  // Footer with CTA
  y += 15
  doc.setFillColor(...primaryColor)
  doc.roundedRect(15, y, 180, 30, 3, 3, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text('Bereit, Ihre Margen zu optimieren?', 105, y + 10, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text('Sprechen Sie mit unseren Experten:', 105, y + 18, { align: 'center' })
  doc.text('📞 +49 6331 7296114  |  ✉️ info@partflow.net', 105, y + 24, { align: 'center' })

  // Final Page - Contact
  doc.setFontSize(8)
  doc.setTextColor(...lightGray)
  doc.text('www.partflow.net  |  info@partflow.net', 105, 285, { align: 'center' })
  doc.text('© 2025 Partflow.net - Powered by DFSC Engineering', 105, 290, { align: 'center' })

  // Generate filename
  const filename = `AIOS_Cost_of_Friction_${leadData.company_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

  // Save PDF
  doc.save(filename)
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}
