/**
 * BOM Risk Calculation Engine
 * Calculates risk scores for each component based on multiple factors
 */

// Risk factor weights
const WEIGHTS = {
  supplierDiversity: 0.25,  // 25%
  leadTime: 0.20,           // 20%
  criticality: 0.20,        // 20%
  costImpact: 0.15,         // 15%
  obsolescence: 0.10,       // 10%
  changeFrequency: 0.10     // 10%
}

/**
 * Calculate risk assessment for entire BOM
 */
export function calculateBomRisk(bomData) {
  // Calculate risk for each part
  const assessments = bomData.map(part => assessPartRisk(part))
  
  // Sort by risk score (highest first)
  assessments.sort((a, b) => b.riskScore - a.riskScore)
  
  // Assign priorities
  assessments.forEach((assessment, index) => {
    assessment.priority = index + 1
  })
  
  // Calculate overall statistics
  const stats = calculateOverallStats(assessments)
  
  return {
    assessments,
    stats,
    recommendations: generateOverallRecommendations(assessments, stats)
  }
}

/**
 * Assess risk for a single part
 */
function assessPartRisk(part) {
  const riskFactors = {
    supplierDiversity: assessSupplierDiversity(part),
    leadTime: assessLeadTime(part),
    criticality: assessCriticality(part),
    costImpact: assessCostImpact(part),
    obsolescence: assessObsolescence(part),
    changeFrequency: assessChangeFrequency(part)
  }
  
  // Calculate weighted risk score
  const riskScore = (
    riskFactors.supplierDiversity.score * WEIGHTS.supplierDiversity +
    riskFactors.leadTime.score * WEIGHTS.leadTime +
    riskFactors.criticality.score * WEIGHTS.criticality +
    riskFactors.costImpact.score * WEIGHTS.costImpact +
    riskFactors.obsolescence.score * WEIGHTS.obsolescence +
    riskFactors.changeFrequency.score * WEIGHTS.changeFrequency
  )
  
  // Determine risk category
  const riskCategory = categorizeRisk(riskScore)
  
  // Generate recommendations
  const recommendation = generatePartRecommendation(part, riskFactors, riskScore)
  
  // Estimate costs
  const costs = estimateCosts(part, riskFactors, riskScore)
  
  return {
    ...part,
    riskScore: Math.round(riskScore),
    riskCategory,
    riskFactors,
    recommendation,
    ...costs,
    priority: null // Will be assigned later
  }
}

/**
 * Assess supplier diversity risk
 */
function assessSupplierDiversity(part) {
  const supplierCount = part.supplierCount || 1
  
  let score, level, recommendation
  
  if (supplierCount === 1) {
    score = 90
    level = 'HIGH'
    recommendation = 'Kritisch: Fügen Sie mindestens einen zweiten Lieferanten hinzu'
  } else if (supplierCount === 2) {
    score = 50
    level = 'MEDIUM'
    recommendation = 'Erwägen Sie einen dritten Lieferanten für mehr Sicherheit'
  } else {
    score = 20
    level = 'LOW'
    recommendation = 'Gute Diversifikation vorhanden'
  }
  
  return {
    score,
    level,
    suppliers: supplierCount,
    recommendation
  }
}

/**
 * Assess lead time risk
 */
function assessLeadTime(part) {
  const leadTime = part.leadTime || 0
  
  let score, level, recommendation
  
  if (leadTime >= 12) {
    score = 85
    level = 'HIGH'
    recommendation = `${leadTime} Wochen Lieferzeit - Bauen Sie 4-6 Monate Sicherheitsbestand auf`
  } else if (leadTime >= 6) {
    score = 55
    level = 'MEDIUM'
    recommendation = `${leadTime} Wochen Lieferzeit - Empfehle 2-3 Monate Sicherheitsbestand`
  } else if (leadTime > 0) {
    score = 25
    level = 'LOW'
    recommendation = `${leadTime} Wochen Lieferzeit - Akzeptabel`
  } else {
    score = 50
    level = 'MEDIUM'
    recommendation = 'Lieferzeit unbekannt - Bitte verifizieren'
  }
  
  return {
    score,
    level,
    weeks: leadTime,
    recommendation
  }
}

/**
 * Assess part criticality
 */
function assessCriticality(part) {
  const category = part.category?.toLowerCase() || 'uncategorized'
  const description = part.description?.toLowerCase() || ''
  
  // Keywords that indicate custom/specialized parts
  const customKeywords = ['custom', 'speziell', 'special', 'proprietary', 'engineered']
  const isCustom = customKeywords.some(keyword => 
    description.includes(keyword) || category.includes(keyword)
  )
  
  let score, level, type, recommendation
  
  if (isCustom) {
    score = 95
    level = 'HIGH'
    type = 'custom'
    recommendation = 'Kundenspezifisches Bauteil - Entwickeln Sie Alternative oder Design-Freeze'
  } else if (category.includes('electronic') || category.includes('elektronik')) {
    score = 70
    level = 'MEDIUM'
    type = 'electronic'
    recommendation = 'Elektronisches Bauteil - Überwachen Sie Obsoleszenz'
  } else if (category.includes('mechanical') || category.includes('mechanik')) {
    score = 40
    level = 'LOW'
    type = 'mechanical'
    recommendation = 'Mechanisches Bauteil - Alternativen verfügbar'
  } else {
    score = 50
    level = 'MEDIUM'
    type = 'standard'
    recommendation = 'Standard-Bauteil - Moderate Verfügbarkeit'
  }
  
  return {
    score,
    level,
    type,
    recommendation
  }
}

/**
 * Assess cost impact risk
 */
function assessCostImpact(part) {
  const annualValue = part.annualValue || 0
  
  let score, level, recommendation
  
  if (annualValue >= 50000) {
    score = 85
    level = 'HIGH'
    recommendation = `${formatCurrency(annualValue)}/Jahr - Verhandeln Sie Rahmenvertrag mit Mengenrabatt`
  } else if (annualValue >= 10000) {
    score = 55
    level = 'MEDIUM'
    recommendation = `${formatCurrency(annualValue)}/Jahr - Nutzen Sie Volumenbündelung`
  } else if (annualValue > 0) {
    score = 25
    level = 'LOW'
    recommendation = `${formatCurrency(annualValue)}/Jahr - Geringer Impact`
  } else {
    score = 40
    level = 'MEDIUM'
    recommendation = 'Kosten unbekannt - Bitte erfassen'
  }
  
  return {
    score,
    level,
    annualValue,
    recommendation
  }
}

/**
 * Assess obsolescence risk
 */
function assessObsolescence(part) {
  const status = part.lifecycleStatus || 'Unknown'
  
  let score, level, recommendation
  
  if (status === 'EOL') {
    score = 95
    level = 'HIGH'
    recommendation = 'DRINGEND: Bauteil abgekündigt - Suchen Sie Alternative oder legen Sie Lifetime-Buy an'
  } else if (status === 'NRND') {
    score = 70
    level = 'MEDIUM'
    recommendation = 'Warnung: Nicht für neue Designs empfohlen - Planen Sie Migration'
  } else if (status === 'Active') {
    score = 15
    level = 'LOW'
    recommendation = 'Aktiv produziert - Kein akutes Risiko'
  } else {
    score = 45
    level = 'MEDIUM'
    recommendation = 'Status unbekannt - Verifizieren Sie Lifecycle beim Hersteller'
  }
  
  return {
    score,
    level,
    status,
    recommendation
  }
}

/**
 * Assess change frequency risk
 */
function assessChangeFrequency(part) {
  // For now, use a heuristic based on part category
  // In production, this would use actual change history
  const category = part.category?.toLowerCase() || ''
  
  let score, level, changesPerYear, recommendation
  
  if (category.includes('electronic') || category.includes('elektronik')) {
    changesPerYear = 4
    score = 75
    level = 'MEDIUM'
    recommendation = 'Häufige Änderungen erwartet - Implementieren Sie Change Management Prozess'
  } else if (category.includes('custom') || category.includes('special')) {
    changesPerYear = 3
    score = 60
    level = 'MEDIUM'
    recommendation = 'Gelegentliche Änderungen - Design Review empfohlen'
  } else {
    changesPerYear = 1
    score = 30
    level = 'LOW'
    recommendation = 'Stabiles Design - Wenige Änderungen erwartet'
  }
  
  return {
    score,
    level,
    changesPerYear,
    recommendation
  }
}

/**
 * Categorize overall risk
 */
function categorizeRisk(score) {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Generate recommendation for a part
 */
function generatePartRecommendation(part, riskFactors, riskScore) {
  const recommendations = []
  
  // Collect high-priority recommendations
  if (riskFactors.supplierDiversity.level === 'HIGH') {
    recommendations.push(riskFactors.supplierDiversity.recommendation)
  }
  if (riskFactors.obsolescence.level === 'HIGH') {
    recommendations.push(riskFactors.obsolescence.recommendation)
  }
  if (riskFactors.leadTime.level === 'HIGH') {
    recommendations.push(riskFactors.leadTime.recommendation)
  }
  
  // Add medium priority if not already too many
  if (recommendations.length < 2) {
    if (riskFactors.costImpact.level !== 'LOW') {
      recommendations.push(riskFactors.costImpact.recommendation)
    }
  }
  
  return recommendations.join(' | ')
}

/**
 * Estimate costs
 */
function estimateCosts(part, riskFactors, riskScore) {
  const annualValue = part.annualValue || 0
  
  // Probability of disruption based on risk score
  const disruptionProbability = riskScore / 100
  
  // Cost of production stoppage (assume 3 days at €5000/day)
  const productionStoppageCost = 3 * 5000
  
  // Emergency procurement premium (30%)
  const emergencyProcurementCost = annualValue * 0.30
  
  // Total cost of inaction
  const costOfInaction = Math.round(
    disruptionProbability * (productionStoppageCost + emergencyProcurementCost)
  )
  
  // Mitigation costs
  let mitigationCost = 0
  
  // Dual sourcing setup
  if (riskFactors.supplierDiversity.level === 'HIGH') {
    mitigationCost += 5000 // One-time setup cost
  }
  
  // Safety stock (3 months)
  if (riskFactors.leadTime.level === 'HIGH' && part.unitPrice) {
    const monthlyUsage = (part.annualVolume || 0) / 12
    mitigationCost += part.unitPrice * monthlyUsage * 3
  }
  
  mitigationCost = Math.round(mitigationCost)
  
  return {
    estimatedCostOfInaction: costOfInaction,
    estimatedMitigationCost: mitigationCost,
    roi: mitigationCost > 0 ? ((costOfInaction - mitigationCost) / mitigationCost * 100).toFixed(0) + '%' : 'N/A'
  }
}

/**
 * Calculate overall statistics
 */
function calculateOverallStats(assessments) {
  const total = assessments.length
  
  const byCategory = {
    CRITICAL: assessments.filter(a => a.riskCategory === 'CRITICAL').length,
    HIGH: assessments.filter(a => a.riskCategory === 'HIGH').length,
    MEDIUM: assessments.filter(a => a.riskCategory === 'MEDIUM').length,
    LOW: assessments.filter(a => a.riskCategory === 'LOW').length
  }
  
  const avgRiskScore = Math.round(
    assessments.reduce((sum, a) => sum + a.riskScore, 0) / total
  )
  
  const totalCostOfInaction = assessments.reduce(
    (sum, a) => sum + a.estimatedCostOfInaction, 0
  )
  
  const totalMitigationCost = assessments.reduce(
    (sum, a) => sum + a.estimatedMitigationCost, 0
  )
  
  // Single source parts
  const singleSourceParts = assessments.filter(
    a => a.riskFactors.supplierDiversity.suppliers === 1
  ).length
  
  // Long lead time parts (>12 weeks)
  const longLeadTimeParts = assessments.filter(
    a => a.riskFactors.leadTime.weeks >= 12
  ).length
  
  // EOL parts
  const eolParts = assessments.filter(
    a => a.riskFactors.obsolescence.status === 'EOL'
  ).length
  
  return {
    totalParts: total,
    byCategory,
    avgRiskScore,
    totalCostOfInaction,
    totalMitigationCost,
    overallROI: totalMitigationCost > 0 
      ? ((totalCostOfInaction - totalMitigationCost) / totalMitigationCost * 100).toFixed(0) + '%'
      : 'N/A',
    keyIssues: {
      singleSourceParts,
      longLeadTimeParts,
      eolParts
    }
  }
}

/**
 * Generate overall recommendations
 */
function generateOverallRecommendations(assessments, stats) {
  const recommendations = []
  
  // Critical parts recommendation
  if (stats.byCategory.CRITICAL > 0) {
    recommendations.push({
      priority: 1,
      title: `${stats.byCategory.CRITICAL} kritische Bauteile sofort adressieren`,
      description: 'Diese Teile haben das höchste Risikopotenzial und sollten priorisiert werden',
      action: 'Dual-Sourcing und Safety Stock implementieren',
      impact: 'HIGH'
    })
  }
  
  // Single source recommendation
  if (stats.keyIssues.singleSourceParts > 10) {
    recommendations.push({
      priority: 2,
      title: `${stats.keyIssues.singleSourceParts} Single-Source Bauteile identifiziert`,
      description: 'Hohe Abhängigkeit von einzelnen Lieferanten',
      action: 'Lieferanten-Diversifikation starten',
      impact: 'HIGH'
    })
  }
  
  // Long lead time recommendation
  if (stats.keyIssues.longLeadTimeParts > 0) {
    recommendations.push({
      priority: 3,
      title: `${stats.keyIssues.longLeadTimeParts} Bauteile mit >12 Wochen Lieferzeit`,
      description: 'Lange Vorlaufzeiten erhöhen Planungsaufwand',
      action: 'Safety Stock für 3-6 Monate aufbauen',
      impact: 'MEDIUM'
    })
  }
  
  // EOL recommendation
  if (stats.keyIssues.eolParts > 0) {
    recommendations.push({
      priority: 4,
      title: `${stats.keyIssues.eolParts} abgekündigte Bauteile gefunden`,
      description: 'Diese Teile sind nicht mehr verfügbar',
      action: 'Alternativen suchen oder Lifetime-Buy durchführen',
      impact: 'CRITICAL'
    })
  }
  
  return recommendations
}

/**
 * Helper: Format currency
 */
function formatCurrency(amount) {
  if (!amount) return '0 €'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Export for use in components
 */
export { formatCurrency }
