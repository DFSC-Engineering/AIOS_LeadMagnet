import Anthropic from '@anthropic-ai/sdk'

export const handler = async (event) => {
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
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiges JSON' }) }
  }

  const { analysisResult } = body

  const prompt = `Du bist ein erfahrener Vertriebler eines deutschen Mittelstandsunternehmens.
Erstelle auf Basis der folgenden RFQ-Analyse eine professionelle, formelle Antwort an den Kunden auf Deutsch.

RFQ-ANALYSE:
- Projekt: ${analysisResult.projektInfo?.titel || 'Anfrage'}
- Kunde: ${analysisResult.projektInfo?.kunde || 'Auftraggeber'}
- Positionen: ${analysisResult.positionen?.length || 0} Teile
- Liefertermin: ${analysisResult.lieferbedingungen?.liefertermin || 'gemäß Anfrage'}
- Triage: ${analysisResult.triage?.empfehlung}
- Offene Fragen: ${analysisResult.offeneFragen?.join('; ') || 'keine'}

Erstelle einen formellen Antwort-Entwurf mit:
1. Professioneller Briefkopf-Betreffzeile
2. Einleitung: Bestätigung des Erhalts und Bereitschaft zur Angebotsabgabe
3. Rückfragen zu den offenen Punkten (falls vorhanden)
4. Terminbestätigung oder -anfrage
5. Professioneller Abschluss mit Kontaktangebot

Stil: Professionell, höflich, geschäftlich. Kein Firmenname für den Absender nötig (Platzhalter "[Ihr Unternehmen]" verwenden).
Länge: 150-250 Wörter. Auf Deutsch.`

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: response.content[0].text })
    }
  } catch (error) {
    console.error('Generate Response Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Fehler: ${error.message}` })
    }
  }
}
