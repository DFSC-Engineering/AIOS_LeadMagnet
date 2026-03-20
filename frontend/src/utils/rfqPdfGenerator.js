import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadPartflowLogo, LOGO_PDF, CURRENT_YEAR, addStandardFooter, addPageNumbers } from './pdfHelpers'

// ── Partflow Farbpalette (Blau/Grün — kein Orange mehr) ──
const C = {
  blue:       [0, 90, 160],      // Partflow Primärblau
  blueDeep:   [0, 55, 110],      // Dunkleres Blau für Kontrast
  blueLight:  [219, 234, 254],   // Hellblau-Hintergrund
  teal:       [0, 128, 110],     // Blaugrüner Akzent für CTA
  tealLight:  [204, 240, 234],
  green:      [21, 128, 61],
  greenBg:    [220, 252, 231],
  red:        [185, 28, 28],
  redBg:      [254, 226, 226],
  amber:      [161, 98, 7],
  amberBg:    [254, 243, 199],
  gray:       [97, 97, 97],
  grayLight:  [246, 247, 249],
  grayMid:    [210, 214, 220],
  black:      [33, 33, 33],
  white:      [255, 255, 255],
}

// ── Anfrage-Qualität berechnen (identisch mit Dashboard-Logik) ──
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
  if (pct >= 80) return { label: 'Vollstaendig',     color: C.green,   pct }
  if (pct >= 60) return { label: 'Gut strukturiert', color: C.blue,    pct }
  if (pct >= 40) return { label: 'Lueckenhaft',      color: C.amber,   pct }
  return               { label: 'Unklar',            color: C.red,     pct }
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
  const W = doc.internal.pageSize.width   // 210 mm
  const H = doc.internal.pageSize.height  // 297 mm
  const M = 18  // Seitenrand

  // Sicherer unterer Umkehrpunkt: 28 mm Abstand zum Seitenende (footer-Puffer)
  const BOTTOM_LIMIT = H - 28
  let y = 0

  const newPage = () => {
    addStandardFooter(doc, 'RFQ Triage Analyse')
    doc.addPage()
    y = 20
  }

  const checkBreak = (needed = 28) => {
    if (y + needed > BOTTOM_LIMIT) {
      newPage()
      return true
    }
    return false
  }

  // Abschnittsüberschrift mit blauer Linie
  const sectionTitle = (title) => {
    checkBreak(18)
    y += 2  // Atemraum vor jedem Abschnitt
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.blueDeep)
    doc.text(title, M, y)
    y += 2
    doc.setDrawColor(...C.blue)
    doc.setLineWidth(0.5)
    doc.line(M, y, W - M, y)
    y += 9
  }

  // ═══════════════════════════════════════════
  // SEITE 1: HEADER + TRIAGE-ENTSCHEIDUNG
  // ═══════════════════════════════════════════

  // Blauer Header-Banner
  doc.setFillColor(...C.blue)
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
  doc.setTextColor(195, 220, 255)
  doc.text('AI Business OS  |  Anfragen-Bewertung', W / 2, 30, { align: 'center' })

  y = 56

  // ── Projektinfo-Box ──
  const infoItems = [
    ['Projekt',         String(projektInfo.titel    || 'Unbekannt')],
    ['Auftraggeber',    String(projektInfo.kunde    || 'Unbekannt')],
    ['Erstellt am',     new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })],
  ]
  if (projektInfo.angebotsFrist)   infoItems.push(['Angebotsfrist',   String(projektInfo.angebotsFrist)])
  if (projektInfo.ansprechpartner) infoItems.push(['Ansprechpartner', String(projektInfo.ansprechpartner)])
  if (projektInfo.referenzNummer)  infoItems.push(['Referenz-Nr.',    String(projektInfo.referenzNummer)])

  const infoBoxH = infoItems.length * 7 + 10
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.grayMid)
  doc.setLineWidth(0.3)
  doc.rect(M, y, W - 2 * M, infoBoxH, 'FD')
  // Blauer Akzentstreifen links
  doc.setFillColor(...C.blue)
  doc.rect(M, y, 3, infoBoxH, 'F')

  infoItems.forEach(([label, val], i) => {
    const rowY = y + 9 + i * 7
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.gray)
    doc.text(label + ':', M + 7, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    const truncated = doc.splitTextToSize(val, W - 2 * M - 50)[0] || ''
    doc.text(truncated, M + 46, rowY)
  })

  y += infoBoxH + 14

  // ── Triage-Entscheidung ──
  sectionTitle('Triage-Entscheidung')

  const emp = triage.empfehlung || 'MAYBE'
  const tc = emp === 'GO'
    ? { bg: C.greenBg, border: C.green, text: C.green }
    : emp === 'NO_GO'
    ? { bg: C.redBg,   border: C.red,   text: C.red   }
    : { bg: C.amberBg, border: C.amber, text: C.amber }

  const begText  = String(triage.begruendung || '')
  const begLines = doc.splitTextToSize(begText, W - 2 * M - 52)
  const triageH  = Math.max(52, begLines.length * 5.5 + 32)

  doc.setFillColor(...tc.bg)
  doc.setDrawColor(...tc.border)
  doc.setLineWidth(0.6)
  doc.rect(M, y, W - 2 * M, triageH, 'FD')

  // Ampel-Badge
  doc.setFillColor(...tc.border)
  doc.roundedRect(M + 5, y + 9, 36, 13, 2, 2, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(emp === 'NO_GO' ? 'NO-GO' : emp, M + 23, y + 18, { align: 'center' })

  // Anfrage-Qualität oben rechts
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...quality.color)
  doc.text(quality.label, W - M - 5, y + 16, { align: 'right' })
  doc.setFontSize(7); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text('Anfrage-Qualitaet', W - M - 5, y + 23, { align: 'right' })

  // Begründung
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.black)
  doc.text(begLines, M + 46, y + 11)

  // Aufwandzeile
  if (triage.aufwandsSchaetzung) {
    const as = triage.aufwandsSchaetzung
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(
      `Geschaetzter Aufwand: ${as.stunden || '—'}h  |  Komplexitaet: ${as.komplexitaet || '—'}`,
      M + 5, y + triageH - 8
    )
  }

  y += triageH + 14

  // ── Stärken & Risiken ──
  if (triage.staerken?.length > 0 || triage.risiken?.length > 0) {
    checkBreak(24)
    sectionTitle('Staerken & Risiken')

    const half = (W - 2 * M - 8) / 2
    const staerkenWrapped = (triage.staerken || []).map(s => doc.splitTextToSize('+ ' + s, half - 10))
    const risikenWrapped  = (triage.risiken  || []).map(r => doc.splitTextToSize('! ' + r, half - 10))
    const sH = staerkenWrapped.reduce((a, l) => a + l.length * 4.8 + 3, 0)
    const rH = risikenWrapped.reduce( (a, l) => a + l.length * 4.8 + 3, 0)
    const colH = Math.max(sH, rH) + 18

    checkBreak(colH + 8)

    // Stärken-Spalte
    if (triage.staerken?.length > 0) {
      doc.setFillColor(...C.green)
      doc.rect(M, y, half, 9, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('STAERKEN', M + half / 2, y + 6.2, { align: 'center' })
      let sy = y + 14
      staerkenWrapped.forEach(lines => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.green)
        doc.text(lines, M + 5, sy)
        sy += lines.length * 4.8 + 3
      })
    }

    // Risiken-Spalte
    if (triage.risiken?.length > 0) {
      const rx = M + half + 8
      doc.setFillColor(...C.red)
      doc.rect(rx, y, half, 9, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('RISIKEN & HERAUSFORDERUNGEN', rx + half / 2, y + 6.2, { align: 'center' })
      let ry = y + 14
      risikenWrapped.forEach(lines => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.red)
        doc.text(lines, rx + 5, ry)
        ry += lines.length * 4.8 + 3
      })
    }

    y += colH + 12
  }

  // ═══════════════════════════════════════════
  // SEITE 2: STÜCKLISTE (eigene Seite)
  // ═══════════════════════════════════════════
  newPage()

  // Blauer Seitenheader
  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 15, 'F')
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(
    `Stueckliste  —  ${positionen.length} Position${positionen.length !== 1 ? 'en' : ''}`,
    M, 10
  )
  const projLabel = doc.splitTextToSize(String(projektInfo.titel || ''), 80)[0] || ''
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(projLabel, W - M, 10, { align: 'right' })

  y = 24

  if (positionen.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, top: 22 },
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
        fillColor: C.blue,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 },
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        overflow: 'linebreak',
        valign: 'top',
      },
      alternateRowStyles: { fillColor: [246, 248, 252] },
      columnStyles: {
        0: { cellWidth: 10,  halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 26,  font: 'courier',  fontSize: 6.5 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 16,  halign: 'center' },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 16,  font: 'courier',  fontSize: 6.5, halign: 'center' },
        7: { cellWidth: 18,  fontSize: 6.5 },
      },
      showHead: 'everyPage',
    })
    y = doc.lastAutoTable.finalY + 14
  } else {
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text('In der Anfrage konnten keine strukturierten Positionen extrahiert werden.', M, y + 10)
    doc.setFontSize(8.5)
    doc.text('Bitte pruefen Sie die Eingabedatei oder verwenden Sie den Text-Upload.', M, y + 20)
    y += 32
  }

  // ═══════════════════════════════════════════
  // SEITE 3: KONDITIONEN + ANFORDERUNGEN + FRAGEN
  // ═══════════════════════════════════════════
  newPage()

  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 15, 'F')
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Konditionen, Anforderungen & offene Fragen', M, 10)

  y = 26

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
      const rowH = Math.max(10, valLines.length * 5.2 + 6)
      checkBreak(rowH + 4)
      doc.setFillColor(246, 248, 252)
      doc.setDrawColor(...C.grayMid)
      doc.setLineWidth(0.2)
      doc.rect(M, y, W - 2 * M, rowH, 'FD')
      doc.setFillColor(...C.blue)
      doc.rect(M, y, 3, rowH, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.gray)
      doc.text(label + ':', M + 7, y + 6.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(valLines, M + 44, y + 6.5)
      y += rowH + 4
    })
    y += 6
  }

  // Technische Anforderungen
  if (technischeAnforderungen.length > 0) {
    checkBreak(24)
    sectionTitle('Technische Anforderungen')
    technischeAnforderungen.forEach(req => {
      const lines = doc.splitTextToSize('- ' + req, W - 2 * M - 10)
      const h = lines.length * 5.2 + 3
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
    checkBreak(24)
    sectionTitle('Offene Fragen vor Angebotsabgabe')
    offeneFragen.forEach((frage, idx) => {
      const fragenLines = doc.splitTextToSize(String(frage), W - 2 * M - 20)
      const boxH = fragenLines.length * 5.2 + 14
      checkBreak(boxH + 5)

      doc.setFillColor(238, 246, 255)
      doc.setDrawColor(...C.blue)
      doc.setLineWidth(0.3)
      doc.rect(M, y, W - 2 * M, boxH, 'FD')

      // Nummerierter Kreis in Blau
      doc.setFillColor(...C.blue)
      doc.circle(M + 9, y + boxH / 2, 4.5, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text(String(idx + 1), M + 9, y + boxH / 2 + 2.8, { align: 'center' })

      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(fragenLines, M + 18, y + 8)
      y += boxH + 5
    })
  }

  // ═══════════════════════════════════════════
  // LETZTE SEITE: PARTFLOW EMPFEHLUNG & CTA
  // ═══════════════════════════════════════════
  newPage()
  y = 0

  // Tief-blauer Header
  doc.setFillColor(...C.blueDeep)
  doc.rect(0, 0, W, 46, 'F')
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  }
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Naechste Schritte', W / 2, 20, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 215, 255)
  doc.text('Beschaffung und Angebotsprozess optimieren mit Partflow.net', W / 2, 30, { align: 'center' })

  y = 58

  // Partflow-Empfehlung (KI-Text)
  if (partflowRelevanz.empfehlung) {
    const pfLines = doc.splitTextToSize(String(partflowRelevanz.empfehlung), W - 2 * M - 18)
    const pfH = pfLines.length * 5.5 + 18
    doc.setFillColor(...C.blueLight)
    doc.setDrawColor(...C.blue)
    doc.setLineWidth(0.5)
    doc.rect(M, y, W - 2 * M, pfH, 'FD')
    doc.setFillColor(...C.blue)
    doc.rect(M, y, 3.5, pfH, 'F')
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    doc.text(pfLines, M + 11, y + 10)
    y += pfH + 14
  }

  // Partflow Vorteile
  const vorteile = [
    ['Angebote in 24 Stunden',    'Statt 5 bis 15 Tage Wartezeit bei traditionellen Lieferanten'],
    ['200+ gepruеfte Partner',    'ISO-zertifizierte Fertigungspartner und Haendler in ganz Europa'],
    ['Ein Ansprechpartner',       'Koordiniert alle Partner und begleitet Sie durch den Beschaffungsprozess'],
    ['Breites Teilespektrum',     'Industrielle Bauteile aller Art nach Zeichnung oder Spezifikation'],
  ]

  vorteile.forEach(([title, desc]) => {
    checkBreak(17)
    doc.setFillColor(246, 248, 252)
    doc.rect(M, y, W - 2 * M, 15, 'F')
    doc.setFillColor(...C.teal)
    doc.rect(M, y, 3.5, 15, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M + 9, y + 6)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(desc, M + 9, y + 12)
    y += 17
  })

  y += 10

  // Teal CTA-Banner
  checkBreak(30)
  doc.setFillColor(...C.teal)
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
