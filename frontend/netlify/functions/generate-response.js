// CommonJS — kein Import, kein Bundler, Node 18 fetch ist eingebaut
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API-Konfiguration fehlt.' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges JSON' }) }
  }

  const { analysisResult } = body

  const prompt = 'Du bist ein erfahrener Vertriebler eines deutschen Mittelstandsunternehmens.\n' +
    'Erstelle auf Basis der folgenden RFQ-Analyse eine professionelle, formelle Antwort an den Kunden auf Deutsch.\n\n' +
    'RFQ-ANALYSE:\n' +
    '- Projekt: ' + (analysisResult.projektInfo && analysisResult.projektInfo.titel || 'Anfrage') + '\n' +
    '- Kunde: ' + (analysisResult.projektInfo && analysisResult.projektInfo.kunde || 'Auftraggeber') + '\n' +
    '- Positionen: ' + (analysisResult.positionen && analysisResult.positionen.length || 0) + ' Teile\n' +
    '- Liefertermin: ' + (analysisResult.lieferbedingungen && analysisResult.lieferbedingungen.liefertermin || 'gemäß Anfrage') + '\n' +
    '- Triage: ' + (analysisResult.triage && analysisResult.triage.empfehlung) + '\n' +
    '- Offene Fragen: ' + (analysisResult.offeneFragen && analysisResult.offeneFragen.join('; ') || 'keine') + '\n\n' +
    'Erstelle einen formellen Antwort-Entwurf mit:\n' +
    '1. Professioneller Briefkopf-Betreffzeile\n' +
    '2. Einleitung: Bestätigung des Erhalts und Bereitschaft zur Angebotsabgabe\n' +
    '3. Rückfragen zu den offenen Punkten (falls vorhanden)\n' +
    '4. Terminbestätigung oder -anfrage\n' +
    '5. Professioneller Abschluss mit Kontaktangebot\n\n' +
    'Stil: Professionell, höflich, geschäftlich. Absender-Platzhalter "[Ihr Unternehmen]" verwenden.\n' +
    'Länge: 150-250 Wörter. Auf Deutsch.'

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: apiResponse.content[0].text })
    }
  } catch (error) {
    console.error('Generate Response Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fehler: ' + error.message })
    }
  }
}
