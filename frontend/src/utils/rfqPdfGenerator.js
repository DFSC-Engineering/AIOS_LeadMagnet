import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadPartflowLogo, LOGO_PDF, CURRENT_YEAR, addStandardFooter, addPageNumbers } from './pdfHelpers'

const C = {
  orange:    [194, 65, 12],
  blue:      [0, 90, 160],
  green:     [21, 128, 61],
  greenBg:   [220, 252, 231],
  red:       [185, 28, 28],
  redBg:     [254, 226, 226],
  amber:     [161, 98, 7],
  amberBg:   [254, 243, 199],
  gray:      [97, 97, 97],
  grayLight: [245, 246, 247],
  grayMid:   [200, 200, 200],
  black:     [33, 33, 33],
  white:     [255, 255, 255],
}

// ── Anfrage-Qualität berechnen (gleiches Modell wie im Dashboard) ──
function calcQuality(analysisResult) {
  const {
    projektInfo = {},
    positionen = [],
    lieferbedingungen = {},
    technischeAnforderungen = [],
  } = analysisResult
  let found = 0, total = 0

  ;[projektInfo.titel, projektInfo.kunde, projektInfo.angebotsFrist, projektInfo.ansprechpartner].forEach(v => {
    total++
    if (v && v !== 'Unbekannt' && v !== null && v !== 'null') found++
  })
  total++
  if (positionen.length > 0) found++
  if (positionen.length > 0) {
    total++
    const withMat = positionen.filter(p => p.material && p.material !== 'null').length
    if (withMat / positionen.length >= 0.5) found++
  }
  ;[lieferbedingungen.liefertermin, lieferbedingungen.lieferort].forEach(v => {
    total++
    if (v && v !== 'null') found++
  })
  total++
  if (technischeAnforderungen.length > 0) found++

  const pct = total > 0 ? Math.round((found / total) * 100) : 0
  if (pct >= 80) return { label: 'Vollstaendig',     color: C.green, pct }
  if (pct >= 60) return { label: 'Gut strukturiert', color: C.blue,  pct }
  if (pct >= 40) return { label: 'Lueckenhaft',      color: C.amber, pct }
  return               { label: 'Unklar',            color: C.red,   pct }
}

export async function generateRfqPDF(analysisResult, leadData) {
  const logoDataUrl = await loadPartflowLogo()

  const {
    projektInfo = {},
    positionen = [],
    technischeAnforderungen = [],
    lieferbedingungen = {},
    triage = {},
    offeneFragen = [],
    partflowRelevanz = {},
  } = analysisResult

  const quality = calcQuality(analysisResult)

  const doc = new jsPDF()
  const W = doc.internal.pageSize.width   // 210
  const H = doc.internal.pageSize.height  // 297
  const M = 18   // margin
  let y = 0

  // Seitenumbruch-Prüfung
  const checkBreak = (needed = 28) => {
    if (y + needed > H - 26) {
      addStandardFooter(doc, 'RFQ Triage Analyse')
      doc.addPage()
      y = 18
      return true
    }
    return false
  }

  // Abschnittsüberschrift
  const sectionTitle = (title) => {
    checkBreak(16)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.orange)
    doc.text(title, M, y)
    y += 2
    doc.setDrawColor(...C.orange)
    doc.setLineWidth(0.4)
    doc.line(M, y, W - M, y)
    y += 8
  }

  // Hilfsfunktion: Text sicher rendern (nie über Rand)
  const safeText = (text, x, startY, maxWidth) => {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth)
    doc.text(lines, x, startY)
    return lines.length
  }

  // ═══════════════════════════════════════════
  // SEITE 1: HEADER + TRIAGE-ENTSCHEIDUNG
  // ═══════════════════════════════════════════

  // Orange Header-Banner
  doc.setFillColor(...C.orange)
  doc.rect(0, 0, W, 46, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  } else {
    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('PARTFLOW', M + 2, 22)
  }

  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('RFQ Triage Analyse', W / 2, 20, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('AI Business OS  |  Anfragen-Bewertung', W / 2, 30, { align: 'center' })

  y = 54

  // ── Projektinfo-Box ──
  const infoItems = [
    ['Projekt',        String(projektInfo.titel    || 'Unbekannt')],
    ['Auftraggeber',   String(projektInfo.kunde    || 'Unbekannt')],
    ['Erstellt am',    new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })],
  ]
  if (projektInfo.angebotsFrist)  infoItems.push(['Angebotsfrist', String(projektInfo.angebotsFrist)])
  if (projektInfo.ansprechpartner) infoItems.push(['Ansprechpartner', String(projektInfo.ansprechpartner)])
  if (projektInfo.referenzNummer)  infoItems.push(['Referenz-Nr.', String(projektInfo.referenzNummer)])

  const infoBoxH = infoItems.length * 7 + 10
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.grayMid)
  doc.setLineWidth(0.3)
  doc.rect(M, y, W - 2 * M, infoBoxH, 'FD')

  infoItems.forEach(([label, val], i) => {
    const rowY = y + 9 + i * 7
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.gray)
    doc.text(label + ':', M + 5, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    // Truncate to one line to prevent overflow in the compact info box
    const maxW = W - 2 * M - 46
    const truncated = doc.splitTextToSize(val, maxW)[0] || ''
    doc.text(truncated, M + 44, rowY)
  })

  y += infoBoxH + 12

  // ── Triage-Entscheidung (Hauptelement) ──
  sectionTitle('Triage-Entscheidung')

  const emp = triage.empfehlung || 'MAYBE'
  const tc = emp === 'GO'
    ? { bg: C.greenBg, border: C.green, text: C.green }
    : emp === 'NO_GO'
    ? { bg: C.redBg,   border: C.red,   text: C.red   }
    : { bg: C.amberBg, border: C.amber, text: C.amber }

  const begText   = String(triage.begruendung || '')
  const begLines  = doc.splitTextToSize(begText, W - 2 * M - 52)
  const triageH   = Math.max(50, begLines.length * 5.2 + 30)

  doc.setFillColor(...tc.bg)
  doc.setDrawColor(...tc.border)
  doc.setLineWidth(0.6)
  doc.rect(M, y, W - 2 * M, triageH, 'FD')

  // Badge
  doc.setFillColor(...tc.border)
  doc.roundedRect(M + 5, y + 8, 36, 13, 2, 2, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(emp === 'NO_GO' ? 'NO-GO' : emp, M + 23, y + 17, { align: 'center' })

  // Anfrage-Qualität (rechts oben im Triage-Block)
  doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...quality.color)
  doc.text(quality.label, W - M - 5, y + 16, { align: 'right' })
  doc.setFontSize(7); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('Anfrage-Qualitaet', W - M - 5, y + 23, { align: 'right' })

  // Begründung
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.black)
  doc.text(begLines, M + 46, y + 10)

  // Aufwandszeile
  if (triage.aufwandsSchaetzung) {
    const as = triage.aufwandsSchaetzung
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(
      `Geschaetzter Aufwand: ${as.stunden || '—'}h  |  Komplexitaet: ${as.komplexitaet || '—'}`,
      M + 5, y + triageH - 7
    )
  }

  y += triageH + 12

  // ── Stärken & Risiken ──
  if (triage.staerken?.length > 0 || triage.risiken?.length > 0) {
    checkBreak(22)
    sectionTitle('Staerken & Risiken')

    const half = (W - 2 * M - 8) / 2
    const staerkenWrapped = (triage.staerken || []).map(s => doc.splitTextToSize('+ ' + s, half - 10))
    const risikenWrapped  = (triage.risiken  || []).map(r => doc.splitTextToSize('! ' + r, half - 10))
    const sHeight = staerkenWrapped.reduce((acc, l) => acc + l.length * 4.5 + 3, 0)
    const rHeight = risikenWrapped.reduce( (acc, l) => acc + l.length * 4.5 + 3, 0)
    const colH = Math.max(sHeight, rHeight) + 16

    checkBreak(colH + 8)

    // Stärken-Spalte
    if (triage.staerken?.length > 0) {
      doc.setFillColor(...C.green)
      doc.rect(M, y, half, 8, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('STAERKEN', M + half / 2, y + 5.5, { align: 'center' })
      let sy = y + 13
      staerkenWrapped.forEach(lines => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.green)
        doc.text(lines, M + 5, sy)
        sy += lines.length * 4.5 + 3
      })
    }

    // Risiken-Spalte
    if (triage.risiken?.length > 0) {
      const rx = M + half + 8
      doc.setFillColor(...C.red)
      doc.rect(rx, y, half, 8, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('RISIKEN & HERAUSFORDERUNGEN', rx + half / 2, y + 5.5, { align: 'center' })
      let ry = y + 13
      risikenWrapped.forEach(lines => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.red)
        doc.text(lines, rx + 5, ry)
        ry += lines.length * 4.5 + 3
      })
    }

    y += colH + 10
  }

  // ═══════════════════════════════════════════
  // SEITE 2: STÜCKLISTE (eigene Seite)
  // ═══════════════════════════════════════════
  addStandardFooter(doc, 'RFQ Triage Analyse')
  doc.addPage()

  // Seitenheader
  doc.setFillColor(...C.orange)
  doc.rect(0, 0, W, 14, 'F')
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(`Stueckliste  —  ${positionen.length} Position${positionen.length !== 1 ? 'en' : ''}`, M, 9.5)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  // Projekttitel rechts (truncated)
  const projTitle = doc.splitTextToSize(String(projektInfo.titel || ''), 80)[0] || ''
  doc.text(projTitle, W - M, 9.5, { align: 'right' })

  if (positionen.length > 0) {
    autoTable(doc, {
      startY: 22,
      margin: { left: M, right: M, top: 5 },
      head: [['Pos.', 'Teilenr.', 'Beschreibung', 'Menge', 'Material', 'Oberfläche', 'Toleranz', 'Termin']],
      body: positionen.map(p => [
        String(p.pos || '—'),
        String(p.teilenummer || '—'),
        String(p.beschreibung || '—'),
        `${p.menge || '—'} ${p.einheit || ''}`.trim(),
        String(p.material || '—'),
        String(p.oberflaechenbehandlung || '—'),
        String(p.toleranz || '—'),
        String(p.liefertermin || '—'),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: C.orange,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        overflow: 'linebreak',
        valign: 'top',
      },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 26, font: 'courier', fontSize: 6.5 },
        2: { cellWidth: 'auto' },   // bekommt den restlichen Platz
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 16, font: 'courier', fontSize: 6.5, halign: 'center' },
        7: { cellWidth: 18, fontSize: 6.5 },
      },
      showHead: 'everyPage',
    })
    y = doc.lastAutoTable.finalY + 12
  } else {
    y = 30
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text('In der Anfrage konnten keine strukturierten Positionen extrahiert werden.', M, y)
    doc.setFontSize(8.5)
    doc.text('Bitte pruefen Sie die Eingabedatei oder verwenden Sie den Text-Upload.', M, y + 8)
    y += 20
  }

  // ═══════════════════════════════════════════
  // SEITE 3: KONDITIONEN + ANFORDERUNGEN + FRAGEN
  // ═══════════════════════════════════════════
  addStandardFooter(doc, 'RFQ Triage Analyse')
  doc.addPage()

  doc.setFillColor(...C.orange)
  doc.rect(0, 0, W, 14, 'F')
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Konditionen, Anforderungen & offene Fragen', M, 9.5)
  y = 24

  // Lieferbedingungen
  const lieferFelder = [
    ['Liefertermin',  lieferbedingungen.liefertermin],
    ['Lieferort',     lieferbedingungen.lieferort],
    ['Incoterms',     lieferbedingungen.incoterms],
    ['Verpackung',    lieferbedingungen.verpackung],
    ['Zahlungsziel',  lieferbedingungen.zahlungsziel],
  ].filter(([, v]) => v && v !== 'null' && v !== null)

  if (lieferFelder.length > 0) {
    sectionTitle('Lieferbedingungen')
    lieferFelder.forEach(([label, val]) => {
      const valLines = doc.splitTextToSize(String(val), W - 2 * M - 44)
      const rowH = Math.max(10, valLines.length * 5 + 6)
      checkBreak(rowH + 3)
      doc.setFillColor(248, 249, 250)
      doc.setDrawColor(...C.grayMid)
      doc.setLineWidth(0.2)
      doc.rect(M, y, W - 2 * M, rowH, 'FD')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.gray)
      doc.text(label + ':', M + 5, y + 6.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(valLines, M + 44, y + 6.5)
      y += rowH + 3
    })
    y += 5
  }

  // Technische Anforderungen
  if (technischeAnforderungen.length > 0) {
    checkBreak(22)
    sectionTitle('Technische Anforderungen')
    technischeAnforderungen.forEach(req => {
      const lines = doc.splitTextToSize('- ' + req, W - 2 * M - 10)
      const h = lines.length * 5 + 3
      checkBreak(h)
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(lines, M + 5, y)
      y += h
    })
    y += 8
  }

  // Offene Fragen
  if (offeneFragen.length > 0) {
    checkBreak(22)
    sectionTitle('Offene Fragen vor Angebotsabgabe')
    offeneFragen.forEach((frage, idx) => {
      const fragenLines = doc.splitTextToSize(String(frage), W - 2 * M - 20)
      const boxH = fragenLines.length * 5 + 12
      checkBreak(boxH + 4)

      doc.setFillColor(255, 251, 235)
      doc.setDrawColor(...C.amber)
      doc.setLineWidth(0.3)
      doc.rect(M, y, W - 2 * M, boxH, 'FD')

      // Nummerierter Kreis
      doc.setFillColor(...C.amber)
      doc.circle(M + 9, y + boxH / 2, 4.5, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text(String(idx + 1), M + 9, y + boxH / 2 + 2.8, { align: 'center' })

      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(fragenLines, M + 18, y + 7)
      y += boxH + 4
    })
  }

  // ═══════════════════════════════════════════
  // LETZTE SEITE: PARTFLOW EMPFEHLUNG & CTA
  // ═══════════════════════════════════════════
  addStandardFooter(doc, 'RFQ Triage Analyse')
  doc.addPage()
  y = 0

  // Blauer Header
  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 46, 'F')
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  }
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Naechste Schritte', W / 2, 20, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Beschaffung und Angebotsprozess optimieren', W / 2, 30, { align: 'center' })

  y = 56

  // Partflow-Empfehlung (von der KI)
  if (partflowRelevanz.empfehlung) {
    const pfLines = doc.splitTextToSize(String(partflowRelevanz.empfehlung), W - 2 * M - 18)
    const pfH = pfLines.length * 5.2 + 16
    doc.setFillColor(235, 245, 255)
    doc.setDrawColor(...C.blue)
    doc.setLineWidth(0.5)
    doc.rect(M, y, W - 2 * M, pfH, 'FD')
    // Blaue Akzentlinie links
    doc.setFillColor(...C.blue)
    doc.rect(M, y, 3.5, pfH, 'F')
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    doc.text(pfLines, M + 11, y + 9)
    y += pfH + 14
  }

  // Partflow Vorteile
  const vorteile = [
    ['Angebote in 24 Stunden', 'Statt 5 bis 15 Tage Wartezeit bei traditionellen Lieferanten'],
    ['200+ gepruеfte Partner', 'ISO-zertifizierte Fertigungspartner quer durch Europa'],
    ['Ein Ansprechpartner', 'Koordiniert alle Lieferanten und begleitet Sie durch den Prozess'],
    ['Standard- & Sonderteile', 'CNC, Blech, Kunststoff, Schweissbaugruppen, Normteile'],
  ]

  vorteile.forEach(([title, desc]) => {
    checkBreak(16)
    doc.setFillColor(248, 250, 252)
    doc.rect(M, y, W - 2 * M, 15, 'F')
    doc.setFillColor(...C.blue)
    doc.rect(M, y, 3.5, 15, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M + 9, y + 6)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(desc, M + 9, y + 12)
    y += 17
  })

  y += 8

  // CTA-Banner
  checkBreak(30)
  doc.setFillColor(...C.orange)
  doc.roundedRect(M, y, W - 2 * M, 28, 2, 2, 'F')
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('www.partflow.net', W / 2, y + 12, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('info@partflow.net  |  +49 6331 7296114', W / 2, y + 21, { align: 'center' })

  addStandardFooter(doc, 'RFQ Triage Analyse')
  addPageNumbers(doc)

  const ts       = new Date().toISOString().split('T')[0]
  const safeName = String(projektInfo.titel || 'RFQ').replace(/[^a-z0-9]/gi, '_').substring(0, 30)
  doc.save(`Partflow_RFQ_Triage_${safeName}_${ts}.pdf`)

  return { success: true }
}
