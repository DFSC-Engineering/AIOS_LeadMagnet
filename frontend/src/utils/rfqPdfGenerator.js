import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { loadPartflowLogo, LOGO_PDF, CURRENT_YEAR, addStandardFooter, addPageNumbers } from './pdfHelpers'

const C = {
  orange:    [194, 65, 12],
  orangeLight:[254, 215, 170],
  blue:      [0, 90, 160],
  green:     [21, 128, 61],
  greenBg:   [220, 252, 231],
  red:       [185, 28, 28],
  redBg:     [254, 226, 226],
  amber:     [161, 98, 7],
  amberBg:   [254, 243, 199],
  gray:      [97, 97, 97],
  grayLight: [245, 245, 245],
  grayMid:   [200, 200, 200],
  black:     [33, 33, 33],
  white:     [255, 255, 255],
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
    partflowRelevanz = {}
  } = analysisResult

  const doc = new jsPDF()
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const M = 18
  let y = 0

  const checkBreak = (needed = 30) => {
    if (y + needed > H - 22) {
      addStandardFooter(doc, 'RFQ Triage Analyse')
      doc.addPage()
      y = 18
      return true
    }
    return false
  }

  const sectionTitle = (title) => {
    checkBreak(18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M, y)
    y += 2
    doc.setDrawColor(...C.orange)
    doc.setLineWidth(0.4)
    doc.line(M, y, W - M, y)
    y += 8
  }

  // ─────────────────────────────────────────
  // SEITE 1: HEADER + TRIAGE-ENTSCHEIDUNG
  // ─────────────────────────────────────────

  doc.setFillColor(...C.orange)
  doc.rect(0, 0, W, 46, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  } else {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('PARTFLOW', M + 2, 22)
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('RFQ Triage Analyse', W / 2, 20, { align: 'center' })
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('AI Business OS  |  Anfragen-Analyse Report', W / 2, 30, { align: 'center' })

  y = 54

  // Projekt-Infobox
  doc.setFillColor(...C.grayLight)
  doc.setDrawColor(...C.grayMid)
  doc.setLineWidth(0.3)
  doc.rect(M, y, W - 2 * M, 28, 'FD')

  const infoRows = [
    ['Projekt:', String(projektInfo.titel || 'Unbekannt').substring(0, 65)],
    ['Auftraggeber:', String(projektInfo.kunde || 'Unbekannt')],
    ['Erstellt:', new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })],
  ]
  if (projektInfo.angebotsFrist) {
    infoRows.push(['Angebotsfrist:', projektInfo.angebotsFrist])
  }

  infoRows.forEach((row, i) => {
    const rowY = y + 7 + i * 7
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(row[0], M + 5, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(row[1], M + 38, rowY)
  })

  y += 36

  // ── TRIAGE-ENTSCHEIDUNG ──
  sectionTitle('Triage-Entscheidung')

  const emp = triage.empfehlung || 'MAYBE'
  const tc = emp === 'GO'     ? { bg: C.greenBg, border: C.green,  text: C.green  }
           : emp === 'NO_GO'  ? { bg: C.redBg,   border: C.red,    text: C.red    }
           :                    { bg: C.amberBg,  border: C.amber,  text: C.amber  }

  doc.setFillColor(...tc.bg)
  doc.setDrawColor(...tc.border)
  doc.setLineWidth(0.5)
  doc.rect(M, y, W - 2 * M, 42, 'FD')

  // Empfehlung-Badge
  doc.setFillColor(...tc.border)
  doc.roundedRect(M + 5, y + 8, 32, 12, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text(emp, M + 21, y + 16, { align: 'center' })

  // Win-Wahrscheinlichkeit
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...tc.text)
  doc.text(`${triage.winWahrscheinlichkeit || '—'}%`, W - M - 5, y + 20, { align: 'right' })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Win-Wahr.', W - M - 5, y + 28, { align: 'right' })

  // Begruendung
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.black)
  const begLines = doc.splitTextToSize(triage.begruendung || '', W - 2 * M - 58)
  doc.text(begLines, M + 42, y + 11)

  // Aufwand-Zeile
  if (triage.aufwandsSchaetzung) {
    const as = triage.aufwandsSchaetzung
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(
      `Aufwand: ${as.stunden}h  |  Komplexitaet: ${as.komplexitaet || '—'}  |  ${as.begruendung || ''}`,
      M + 6, y + 37
    )
  }

  y += 52

  // ── STAERKEN & RISIKEN ──
  if ((triage.staerken?.length > 0) || (triage.risiken?.length > 0)) {
    checkBreak(20)
    sectionTitle('Staerken & Risiken')

    const half = (W - 2 * M - 8) / 2

    // Staerken-Spalte
    if (triage.staerken?.length > 0) {
      doc.setFillColor(...C.green)
      doc.rect(M, y, half, 8, 'F')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('STAERKEN', M + half / 2, y + 5.5, { align: 'center' })
      let sy = y + 13
      triage.staerken.forEach(s => {
        const lines = doc.splitTextToSize('+ ' + s, half - 8)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.green)
        doc.text(lines, M + 5, sy)
        sy += lines.length * 4.5 + 2
      })
    }

    // Risiken-Spalte
    if (triage.risiken?.length > 0) {
      const rx = M + half + 8
      doc.setFillColor(...C.red)
      doc.rect(rx, y, half, 8, 'F')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.white)
      doc.text('RISIKEN', rx + half / 2, y + 5.5, { align: 'center' })
      let ry = y + 13
      triage.risiken.forEach(r => {
        const lines = doc.splitTextToSize('! ' + r, half - 8)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.red)
        doc.text(lines, rx + 5, ry)
        ry += lines.length * 4.5 + 2
      })
    }

    y += Math.max(
      8 + (triage.staerken?.length || 0) * 11,
      8 + (triage.risiken?.length || 0) * 11
    ) + 12
  }

  // ── POSITIONEN-TABELLE ──
  if (positionen.length > 0) {
    checkBreak(24)
    sectionTitle(`Extrahierte Positionen (${positionen.length})`)

    autoTable(doc, {
      startY: y,
      head: [['Pos.', 'Teilenr.', 'Beschreibung', 'Menge', 'Material', 'Toleranz']],
      body: positionen.map(p => [
        String(p.pos || '—'),
        String(p.teilenummer || '—'),
        String(p.beschreibung || '—').substring(0, 48),
        `${p.menge || '—'} ${p.einheit || ''}`.trim(),
        String(p.material || '—'),
        String(p.toleranz || '—'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: C.orange, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30, font: 'courier', fontSize: 6.5 },
        2: { cellWidth: 65 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 28 },
        5: { cellWidth: 18, font: 'courier', fontSize: 6.5 },
      },
    })

    y = doc.lastAutoTable.finalY + 12
  }

  // ─────────────────────────────────────────
  // SEITE 2: LIEFERBEDINGUNGEN + OFFENE FRAGEN
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'RFQ Triage Analyse')
  doc.addPage()
  y = 18

  doc.setFillColor(...C.orange)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Lieferbedingungen, Anforderungen & Offene Fragen', M, 8)
  y = 22

  // Lieferbedingungen
  const lieferFelder = [
    ['Liefertermin',   lieferbedingungen.liefertermin],
    ['Lieferort',      lieferbedingungen.lieferort],
    ['Incoterms',      lieferbedingungen.incoterms],
    ['Verpackung',     lieferbedingungen.verpackung],
    ['Zahlungsziel',   lieferbedingungen.zahlungsziel],
  ].filter(([, v]) => v && v !== 'null')

  if (lieferFelder.length > 0) {
    sectionTitle('Lieferbedingungen')
    lieferFelder.forEach(([label, val]) => {
      checkBreak(10)
      doc.setFillColor(248, 248, 248)
      doc.rect(M, y, W - 2 * M, 9, 'F')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.black)
      doc.text(label + ':', M + 5, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.gray)
      doc.text(String(val), M + 40, y + 6)
      y += 12
    })
    y += 4
  }

  // Technische Anforderungen
  if (technischeAnforderungen.length > 0) {
    checkBreak(20)
    sectionTitle('Technische Anforderungen')
    technischeAnforderungen.forEach(req => {
      checkBreak(9)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      const lines = doc.splitTextToSize('- ' + req, W - 2 * M - 5)
      doc.text(lines, M + 5, y)
      y += lines.length * 5 + 2
    })
    y += 6
  }

  // Offene Fragen
  if (offeneFragen.length > 0) {
    checkBreak(20)
    sectionTitle('Offene Fragen vor Angebotsabgabe')
    offeneFragen.forEach((frage, idx) => {
      checkBreak(14)
      doc.setFillColor(255, 251, 235)
      doc.setDrawColor(...C.amber)
      doc.setLineWidth(0.3)
      const fragenLines = doc.splitTextToSize(frage, W - 2 * M - 16)
      const boxH = fragenLines.length * 5 + 6
      doc.rect(M, y, W - 2 * M, boxH, 'FD')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.amber)
      doc.text(`${idx + 1}.`, M + 5, y + boxH / 2 + 2)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.black)
      doc.text(fragenLines, M + 14, y + 5)
      y += boxH + 3
    })
  }

  // ─────────────────────────────────────────
  // LETZTE SEITE: PARTFLOW EMPFEHLUNG & CTA
  // ─────────────────────────────────────────
  addStandardFooter(doc, 'RFQ Triage Analyse')
  doc.addPage()
  y = 0

  // Voll-Blau-Header
  doc.setFillColor(...C.blue)
  doc.rect(0, 0, W, 46, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', M, 9, LOGO_PDF.w, LOGO_PDF.h)
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('Naechste Schritte', W / 2, 20, { align: 'center' })
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Teile beschaffen mit Partflow.net', W / 2, 30, { align: 'center' })

  y = 56

  // Partflow-Empfehlung aus Analyse
  if (partflowRelevanz.empfehlung) {
    doc.setFillColor(235, 245, 255)
    doc.setDrawColor(...C.blue)
    doc.setLineWidth(0.4)
    const pfLines = doc.splitTextToSize(partflowRelevanz.empfehlung, W - 2 * M - 16)
    const pfH = pfLines.length * 5 + 12
    doc.rect(M, y, W - 2 * M, pfH, 'FD')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.black)
    doc.text(pfLines, M + 8, y + 8)
    y += pfH + 10
  }

  // Vorteile
  const vorteile = [
    ['24h Angebotszeit', 'Statt 5-15 Tage Wartezeit bei traditionellen Lieferanten'],
    ['200+ Fertigungspartner', 'ISO-zertifiziert in 12 europaeischen Laendern'],
    ['15-30% Kosteneinsparung', 'Durch Wettbewerb und optimierte Beschaffung'],
    ['Ein Ansprechpartner', 'Statt 5+ Lieferanten gleichzeitig zu koordinieren'],
    ['Standard- & Sonderteile', 'CNC, Blech, Kunststoff, Normteile und mehr'],
  ]

  vorteile.forEach(([title, desc]) => {
    checkBreak(18)
    doc.setFillColor(248, 248, 248)
    doc.rect(M, y, W - 2 * M, 14, 'F')
    doc.setFillColor(...C.blue)
    doc.rect(M, y, 3, 14, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.black)
    doc.text(title, M + 8, y + 6)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.gray)
    doc.text(desc, M + 8, y + 11)
    y += 17
  })

  y += 6

  // CTA-Banner
  checkBreak(28)
  doc.setFillColor(...C.orange)
  doc.rect(M, y, W - 2 * M, 26, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.white)
  doc.text('www.partflow.net', W / 2, y + 11, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('info@partflow.net  |  +49 6331 7296114', W / 2, y + 20, { align: 'center' })

  addStandardFooter(doc, 'RFQ Triage Analyse')
  addPageNumbers(doc)

  const ts = new Date().toISOString().split('T')[0]
  const safeName = String(projektInfo.titel || 'RFQ').replace(/[^a-z0-9]/gi, '_').substring(0, 30)
  doc.save(`Partflow_RFQ_Triage_${safeName}_${ts}.pdf`)

  return { success: true }
}
