// CommonJS — kein Import, kein Bundler, Node 18 fetch ist eingebaut
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const ANALYSIS_PROMPT = `Du bist ein erfahrener industrieller Einkaufs- und Vertriebsexperte für den deutschen Mittelstand.
Analysiere die vorliegende Anfrage (RFQ / Ausschreibung) und extrahiere alle relevanten Informationen.

WICHTIG ZU PARTFLOW: Partflow.net ist eine B2B-Beschaffungsplattform für industrielle Bauteile und Komponenten.
Partflow arbeitet mit 200+ Fertigungspartnern und Händlern für Standard- UND kundenspezifische Teile:
- CNC-gefräste und gedrehte Teile, Blechbauteile, Schweißbaugruppen
- Kunststoffteile (Spritzguss, 3D-Druck, Fräsen)
- Normteile, Kaufteile, elektronische Komponenten
- Sonderanfertigungen nach Zeichnung oder Spezifikation
Partflow bietet 24h-Angebote und beschleunigt die Beschaffung erheblich.
Finde IMMER konkrete Anwendungsfälle für Partflow bei der vorliegenden Anfrage.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, ohne Markdown-Code-Blöcke, ohne Erklärungen davor oder danach.

Das JSON-Objekt muss diese exakte Struktur haben:
{
  "projektInfo": {
    "titel": "Titel der Anfrage oder 'Unbekannt'",
    "kunde": "Firmenname des Kunden oder 'Unbekannt'",
    "referenzNummer": "RFQ-Nummer oder Auftragsnummer oder null",
    "anfragesDatum": "Datum der Anfrage oder null",
    "angebotsFrist": "Deadline für Angebot oder null",
    "ansprechpartner": "Name des Ansprechpartners oder null"
  },
  "positionen": [
    {
      "pos": 1,
      "teilenummer": "Teilenummer oder Zeichnungsnummer",
      "beschreibung": "Beschreibung des Bauteils",
      "menge": 10,
      "einheit": "Stück",
      "material": "Werkstoff/Material oder null",
      "oberflaechenbehandlung": "Beschichtung/Oberfläche oder null",
      "toleranz": "Toleranzklasse oder null",
      "zeichnungsnummer": "Zeichnungsnummer falls vorhanden oder null",
      "liefertermin": "Gewünschter Liefertermin oder null"
    }
  ],
  "technischeAnforderungen": [
    "Liste konkreter technischer Anforderungen (Normen, Zertifizierungen, Prüfungen etc.)"
  ],
  "lieferbedingungen": {
    "liefertermin": "Gewünschter Gesamtliefertermin",
    "lieferort": "Lieferadresse oder Werk",
    "incoterms": "Incoterms falls angegeben oder null",
    "verpackung": "Verpackungsvorschriften oder null",
    "zahlungsziel": "Zahlungsbedingungen oder null"
  },
  "triage": {
    "empfehlung": "GO oder MAYBE oder NO_GO",
    "begruendung": "2-3 Sätze Begründung der Empfehlung auf Deutsch",
    "winWahrscheinlichkeit": 70,
    "aufwandsSchaetzung": {
      "stunden": 8,
      "komplexitaet": "HOCH oder MITTEL oder NIEDRIG",
      "begruendung": "Kurze Begründung des Aufwands"
    },
    "risiken": [
      "Konkrete Risiken für die Angebotsabgabe"
    ],
    "staerken": [
      "Punkte, die für eine Angebotsabgabe sprechen"
    ]
  },
  "offeneFragen": [
    "Liste offener Fragen oder fehlender Informationen, die vor Angebotsabgabe geklärt werden sollten"
  ],
  "partflowRelevanz": {
    "beschaffbareParts": 3,
    "empfehlung": "Erkläre konkret wie Partflow.net bei DIESER Anfrage helfen kann — z.B. Beschaffung von Rohmaterial, Zukaufteile, Normteile, Fertigungskapazität für Sonderteile oder schnelle Alternativangebote. Partflow hat immer einen Mehrwert für industrielle Beschaffungsaufgaben.",
    "vorteile": ["Konkreter Vorteil 1 von Partflow für diese spezifische Anfrage", "Konkreter Vorteil 2"]
  }
}`

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API-Konfiguration fehlt. Bitte ANTHROPIC_API_KEY als Netlify Environment Variable setzen.' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges JSON im Request Body' }) }
  }

  const { inputType, content } = body

  if (!inputType || !content) {
    return { statusCode: 400, body: JSON.stringify({ error: 'inputType und content sind erforderlich' }) }
  }

  try {
    let messageContent = []
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }

    if (inputType === 'pdf') {
      headers['anthropic-beta'] = 'pdfs-2024-09-25'
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: content.pdfBase64
          }
        },
        {
          type: 'text',
          text: ANALYSIS_PROMPT
        }
      ]
    } else if (inputType === 'text') {
      messageContent = [
        {
          type: 'text',
          text: ANALYSIS_PROMPT + '\n\n---\nRFQ / ANFRAGE:\n' + content.text
        }
      ]
    } else if (inputType === 'bom') {
      const bomText = content.bomData
        .map(function(row, i) { return 'Position ' + (i + 1) + ': ' + JSON.stringify(row) })
        .join('\n')
      messageContent = [
        {
          type: 'text',
          text: ANALYSIS_PROMPT + '\n\n---\nSTÜCKLISTEN-DATEN (aus Upload):\n' + bomText
        }
      ]
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unbekannter inputType: ' + inputType }) }
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: messageContent }]
      })
    })

    if (!response.ok) {
      let errMsg = 'Claude API Fehler: ' + response.status
      try {
        const errData = await response.json()
        if (errData.error && errData.error.message) errMsg = errData.error.message
      } catch (e) {}
      throw new Error(errMsg)
    }

    const apiResponse = await response.json()
    const rawText = apiResponse.content[0].text.trim()

    // JSON aus Antwort extrahieren
    let jsonText = rawText
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    } else {
      const objMatch = rawText.match(/\{[\s\S]*\}/)
      if (objMatch) jsonText = objMatch[0]
    }

    const result = JSON.parse(jsonText)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('RFQ Analysis Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Analyse fehlgeschlagen: ' + error.message,
        details: error.name === 'SyntaxError' ? 'JSON-Parsing der KI-Antwort fehlgeschlagen' : undefined
      })
    }
  }
}
