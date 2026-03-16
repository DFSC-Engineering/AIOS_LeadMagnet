import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './riskCalculations'

// Professional Color Palette
const COLORS = {
  primary: [0, 122, 204],        // Partflow Blue
  accent: [138, 43, 226],        // Purple
  critical: [220, 38, 38],       // Red
  high: [249, 115, 22],          // Orange
  medium: [234, 179, 8],         // Yellow
  low: [34, 197, 94],            // Green
  gray: [107, 114, 128],         // Gray
  lightGray: [243, 244, 246],    // Light Gray
  white: [255, 255, 255]
}

export function generateBomRiskPDF({ assessments, stats, recommendations, fileName }) {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    let yPos = 20

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    const checkPageBreak = (needed = 30) => {
      if (yPos + needed > pageHeight - 30) {
        addFooter(doc)
        doc.addPage()
        yPos = 20
        return true
      }
      return false
    }

    const drawBox = (x, y, w, h, bgColor, borderColor = null) => {
      doc.setFillColor(...bgColor)
      if (borderColor) {
        doc.setDrawColor(...borderColor)
        doc.rect(x, y, w, h, 'FD')
      } else {
        doc.rect(x, y, w, h, 'F')
      }
    }

    const addSectionTitle = (title, icon = '') => {
      checkPageBreak(15)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${icon} ${title}`, margin, yPos)
      yPos += 2
      doc.setDrawColor(...COLORS.primary)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10
    }

    // ==========================================
    // PAGE 1: HEADER & EXECUTIVE SUMMARY
    // ==========================================

    // Professional Header with Branding
    drawBox(0, 0, pageWidth, 45, COLORS.primary)
    
    // Logo placeholder (white box)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(15, 10, 40, 25, 2, 2, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text('PARTFLOW', 20, 23)
    
    // Main Title
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('BOM RISK ASSESSMENT', pageWidth / 2, 22, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Supply Chain Risk Analysis Report', pageWidth / 2, 32, { align: 'center' })
    
    yPos = 55

    // File Info Box
    drawBox(margin, yPos, pageWidth - 2 * margin, 25, COLORS.lightGray, COLORS.gray)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('File:', margin + 5, yPos + 8)
    doc.setFont('helvetica', 'normal')
    doc.text(fileName, margin + 25, yPos + 8)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Date:', margin + 5, yPos + 16)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date().toLocaleDateString('de-DE', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }), margin + 25, yPos + 16)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Parts:', pageWidth / 2 + 5, yPos + 8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${stats.totalParts} analyzed`, pageWidth / 2 + 25, yPos + 8)
    
    yPos += 35

    // EXECUTIVE SUMMARY
    addSectionTitle('EXECUTIVE SUMMARY', '📊')

    // Key Metrics Grid (2x2)
    const boxWidth = (pageWidth - 2 * margin - 10) / 2
    const boxHeight = 35

    // Average Risk Score
    drawBox(margin, yPos, boxWidth, boxHeight, [254, 226, 226], COLORS.critical)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.critical)
    doc.text('Average Risk Score', margin + 5, yPos + 10)
    doc.setFontSize(28)
    doc.text(`${stats.avgRiskScore}`, margin + 5, yPos + 25)
    doc.setFontSize(9)
    doc.text('/ 100', margin + 30, yPos + 25)

    // Critical Parts
    drawBox(margin + boxWidth + 10, yPos, boxWidth, boxHeight, [255, 237, 213], COLORS.high)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.high)
    doc.text('Critical Parts', margin + boxWidth + 15, yPos + 10)
    doc.setFontSize(28)
    doc.text(`${stats.byCategory.CRITICAL + stats.byCategory.HIGH}`, margin + boxWidth + 15, yPos + 25)
    doc.setFontSize(9)
    doc.text(`${stats.byCategory.CRITICAL} Critical / ${stats.byCategory.HIGH} High`, 
              margin + boxWidth + 15, yPos + 32)

    yPos += boxHeight + 5

    // Cost of Inaction
    drawBox(margin, yPos, boxWidth, boxHeight, [243, 232, 255], COLORS.accent)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.accent)
    doc.text('Estimated Risk Cost', margin + 5, yPos + 10)
    doc.setFontSize(20)
    doc.text(formatCurrency(stats.totalCostOfInaction), margin + 5, yPos + 25)
    doc.setFontSize(8)
    doc.text('per year if untreated', margin + 5, yPos + 32)

    // ROI
    drawBox(margin + boxWidth + 10, yPos, boxWidth, boxHeight, [220, 252, 231], COLORS.low)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.low)
    doc.text('Mitigation ROI', margin + boxWidth + 15, yPos + 10)
    doc.setFontSize(28)
    doc.text(stats.overallROI, margin + boxWidth + 15, yPos + 25)
    doc.setFontSize(8)
    doc.text('Return on Investment', margin + boxWidth + 15, yPos + 32)

    yPos += boxHeight + 15

    // RISK DISTRIBUTION
    addSectionTitle('RISK DISTRIBUTION', '📈')

    const riskData = [
      { label: 'CRITICAL', count: stats.byCategory.CRITICAL, color: COLORS.critical, textColor: [255, 255, 255] },
      { label: 'HIGH', count: stats.byCategory.HIGH, color: COLORS.high, textColor: [255, 255, 255] },
      { label: 'MEDIUM', count: stats.byCategory.MEDIUM, color: COLORS.medium, textColor: [255, 255, 255] },
      { label: 'LOW', count: stats.byCategory.LOW, color: COLORS.low, textColor: [255, 255, 255] }
    ]

    const barWidth = pageWidth - 2 * margin
    const barHeight = 8
    let xOffset = margin

    riskData.forEach(item => {
      const percentage = (item.count / stats.totalParts) * 100
      const segmentWidth = (barWidth * percentage) / 100

      if (segmentWidth > 0) {
        drawBox(xOffset, yPos, segmentWidth, barHeight, item.color)
        xOffset += segmentWidth
      }
    })

    yPos += barHeight + 10

    // Legend
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    let legendX = margin
    riskData.forEach(item => {
      const percentage = ((item.count / stats.totalParts) * 100).toFixed(1)
      
      // Color box
      drawBox(legendX, yPos, 4, 4, item.color)
      
      // Text
      doc.setTextColor(0, 0, 0)
      doc.text(`${item.label}: ${item.count} (${percentage}%)`, legendX + 6, yPos + 3)
      
      legendX += 45
    })

    yPos += 15

    // CRITICAL ISSUES
    addSectionTitle('CRITICAL ISSUES', '🚨')

    const issues = [
      {
        title: 'Single-Source Parts',
        count: stats.keyIssues.singleSourceParts,
        description: 'Only one supplier - High failure risk',
        icon: '🏭',
        color: COLORS.critical
      },
      {
        title: 'Long Lead Times',
        count: stats.keyIssues.longLeadTimeParts,
        description: 'Parts with >12 weeks lead time',
        icon: '⏱️',
        color: COLORS.high
      },
      {
        title: 'EOL / Obsolete',
        count: stats.keyIssues.eolParts,
        description: 'Parts no longer available',
        icon: '⚠️',
        color: COLORS.accent
      }
    ]

    issues.forEach(issue => {
      checkPageBreak(28)
      
      drawBox(margin, yPos, pageWidth - 2 * margin, 25, [255, 245, 245], issue.color)
      
      // Icon & Count
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...issue.color)
      doc.text(issue.count.toString(), margin + 8, yPos + 12)
      
      // Title
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`${issue.icon} ${issue.title}`, margin + 25, yPos + 10)
      
      // Description
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.gray)
      doc.text(issue.description, margin + 25, yPos + 18)
      
      yPos += 30
    })

    // NEW PAGE FOR RECOMMENDATIONS
    addFooter(doc)
    doc.addPage()
    yPos = 20

    // RECOMMENDATIONS
    addSectionTitle('PRIORITIZED RECOMMENDATIONS', '💡')

    recommendations.forEach((rec, idx) => {
      checkPageBreak(40)

      const bgColor = rec.impact === 'CRITICAL' ? [254, 226, 226] :
                      rec.impact === 'HIGH' ? [255, 237, 213] : [254, 249, 195]
      const borderColor = rec.impact === 'CRITICAL' ? COLORS.critical :
                          rec.impact === 'HIGH' ? COLORS.high : COLORS.medium

      drawBox(margin, yPos, pageWidth - 2 * margin, 35, bgColor, borderColor)

      // Priority Badge
      doc.setFillColor(...borderColor)
      doc.circle(margin + 8, yPos + 10, 5, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(rec.priority.toString(), margin + 8, yPos + 12, { align: 'center' })

      // Title
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      const titleLines = doc.splitTextToSize(rec.title, pageWidth - 2 * margin - 25)
      doc.text(titleLines, margin + 18, yPos + 8)

      // Description
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.gray)
      const descLines = doc.splitTextToSize(rec.description, pageWidth - 2 * margin - 25)
      doc.text(descLines, margin + 18, yPos + 16)

      // Action
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Action: ', margin + 18, yPos + 26)
      doc.setFont('helvetica', 'normal')
      const actionLines = doc.splitTextToSize(rec.action, pageWidth - 2 * margin - 40)
      doc.text(actionLines, margin + 35, yPos + 26)

      yPos += 40
    })

    // NEW PAGE FOR TABLE
    addFooter(doc)
    doc.addPage()
    yPos = 20

    // TOP 10 CRITICAL PARTS TABLE
    addSectionTitle('TOP 10 CRITICAL PARTS', '🔝')

    const tableData = assessments.slice(0, 10).map(part => [
      part.priority.toString(),
      part.partNumber,
      part.description.substring(0, 40) + (part.description.length > 40 ? '...' : ''),
      part.riskScore.toString(),
      part.riskCategory,
      formatCurrency(part.estimatedCostOfInaction)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Part Number', 'Description', 'Risk', 'Category', 'Cost Impact']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 35, font: 'courier', fontSize: 7 },
        2: { cellWidth: 65 },
        3: { cellWidth: 15, halign: 'center', fontStyle: 'bold', fontSize: 10 },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 33, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Risk Score - Color by value
          if (data.column.index === 3) {
            const score = parseInt(data.cell.raw)
            if (score >= 80) {
              data.cell.styles.textColor = COLORS.critical
            } else if (score >= 60) {
              data.cell.styles.textColor = COLORS.high
            } else if (score >= 40) {
              data.cell.styles.textColor = COLORS.medium
            }
          }
          
          // Category - Colored badges
          if (data.column.index === 4) {
            const category = data.cell.raw
            if (category === 'CRITICAL') {
              data.cell.styles.fillColor = COLORS.critical
              data.cell.styles.textColor = COLORS.white
            } else if (category === 'HIGH') {
              data.cell.styles.fillColor = COLORS.high
              data.cell.styles.textColor = COLORS.white
            } else if (category === 'MEDIUM') {
              data.cell.styles.fillColor = COLORS.medium
              data.cell.styles.textColor = COLORS.white
            } else {
              data.cell.styles.fillColor = COLORS.low
              data.cell.styles.textColor = COLORS.white
            }
          }
        }
      }
    })

    // Add footer to last page
    addFooter(doc)

    // Final page count
    const totalPages = doc.internal.getNumberOfPages()

    // Add page numbers to all pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.gray)
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_')
    const pdfFileName = `BOM_Risk_Assessment_${cleanFileName}_${timestamp}.pdf`

    // Save PDF
    doc.save(pdfFileName)

    return {
      success: true,
      fileName: pdfFileName,
      pages: totalPages
    }

  } catch (error) {
    console.error('PDF Generation Error:', error)
    throw new Error(`PDF generation failed: ${error.message}`)
  }
}

// Footer function
function addFooter(doc) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Footer background
  doc.setFillColor(240, 240, 240)
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F')

  // Footer content
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')

  // Left: Company info
  doc.text('© 2025 Partflow.net - Powered by DFSC Engineering', margin, pageHeight - 12)

  // Center: Contact
  doc.text(
    'info@partflow.net | +49 6331 7296114',
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  )

  // Right: Website
  doc.text('www.partflow.net', pageWidth - margin, pageHeight - 12, { align: 'right' })

  // Tagline
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Professional Supply Chain Risk Analysis',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  )
}
