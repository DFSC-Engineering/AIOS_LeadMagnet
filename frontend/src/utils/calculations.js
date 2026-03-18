/**
 * Cost of Friction Calculation Engine
 * Based on CALCULATION_LOGIC.md specifications
 */

export function calculateCostOfFriction(formData) {
  const {
    annualRevenue,
    targetMargin,
    rfqPerMonth,
    hoursPerRfq,
    percentAdminTime,
    engineerHourlyRate,
    drawingsPerMonth,
    minutesPerDrawing,
    technicianHourlyRate,
    suppliersManaged,
    hoursSupplierCoordination,
    annualProcurementVolume,
    mavericksSpendPercent,
    redesignCyclesPerYear,
    costPerRedesignCycle,
    productionDelayDays,
    dailyProductionValue,
  } = formData

  // ===== ETO QUOTE PROCESS COSTS =====
  const rfqAdminCostPerYear = 
    rfqPerMonth * 
    hoursPerRfq * 
    (percentAdminTime / 100) * 
    engineerHourlyRate * 
    12

  const opportunityCostPerYear = rfqAdminCostPerYear * 0.25 // ~25% Opportunitätskosten: Ingenieurzeit für Administration statt Kerngeschäft

  const etoTotalCost = rfqAdminCostPerYear + opportunityCostPerYear

  // ===== PDF TRAP COSTS =====
  const manualDataEntryCost = 
    drawingsPerMonth * 
    (minutesPerDrawing / 60) * 
    technicianHourlyRate * 
    12

  const errorCorrectionCost = manualDataEntryCost * 0.15 // ~15% rework due to errors
  
  const pdfTrapCost = manualDataEntryCost + errorCorrectionCost

  // ===== DARK PURCHASING COSTS =====
  const supplierCoordinationCost = 
    suppliersManaged * 
    hoursSupplierCoordination * 
    engineerHourlyRate * 
    12

  const lostVolumeDiscounts = 
    annualProcurementVolume * 
    (mavericksSpendPercent / 100) * 
    0.15 // Estimated 15% premium on maverick purchases

  const darkPurchasingCost = supplierCoordinationCost + lostVolumeDiscounts

  // ===== BOM DISCONNECT COSTS =====
  const redesignCost = redesignCyclesPerYear * costPerRedesignCycle

  const productionDelayCost = 
    redesignCyclesPerYear * 
    productionDelayDays * 
    dailyProductionValue

  const bomDisconnectCost = redesignCost + productionDelayCost

  // ===== TOTAL COST OF FRICTION =====
  const totalCostOfFriction = 
    etoTotalCost + 
    pdfTrapCost + 
    darkPurchasingCost + 
    bomDisconnectCost

  const frictionAsPercentOfRevenue = (totalCostOfFriction / annualRevenue) * 100

  // ===== POTENTIAL GAINS =====
  const potentialMarginGain = frictionAsPercentOfRevenue
  const newMargin = targetMargin + potentialMarginGain

  // ===== ROI PROJECTION (Partflow.net) =====
  // Realistisches Einsparpotenzial: Partflow adressiert direkt Beschaffungs- und Prozesskosten.
  // Dark Purchasing (Lieferantenkonsolidierung, Maverick Spend): ~60% Potenzial
  // PDF-Falle (CAD-Upload, weniger manuelle Dateneingabe): ~40% Potenzial
  // ETO-Engpass (schnellere Angebote durch Netzwerk): ~20% Potenzial
  // BOM-Disconnect (bessere Quellenverfügbarkeit): ~15% Potenzial
  // Gewichteter Durchschnitt über alle Cluster: ~30-40% → konservativ mit 35%
  const estimatedAnnualSavings = totalCostOfFriction * 0.35 // 35% realistische Einsparung
  const estimatedSetupCost = 5000 // Einmalige Integrationskosten (Schätzwert)
  const monthlySubscriptionCost = 0 // Partflow.net ist kostenlos für Einkäufer
  const annualOngoingCost = monthlySubscriptionCost * 12

  const netAnnualSavings = estimatedAnnualSavings - annualOngoingCost
  const roiMonths = (estimatedSetupCost / (netAnnualSavings / 12)).toFixed(1)
  const roiPercent = ((netAnnualSavings / estimatedSetupCost) * 100).toFixed(0)

  // ===== BREAKDOWN FOR CHARTS =====
  const breakdown = {
    etoEngpass: {
      label: 'ETO-Vertriebs-Engpass',
      value: etoTotalCost,
      percent: (etoTotalCost / totalCostOfFriction) * 100,
      color: '#ea580c', // orange-600
      details: {
        adminCost: rfqAdminCostPerYear,
        opportunityCost: opportunityCostPerYear,
      }
    },
    pdfTrap: {
      label: 'PDF-Falle',
      value: pdfTrapCost,
      percent: (pdfTrapCost / totalCostOfFriction) * 100,
      color: '#dc2626', // red-600
      details: {
        dataEntryCost: manualDataEntryCost,
        errorCorrectionCost: errorCorrectionCost,
      }
    },
    darkPurchasing: {
      label: 'Dark Purchasing',
      value: darkPurchasingCost,
      percent: (darkPurchasingCost / totalCostOfFriction) * 100,
      color: '#9333ea', // purple-600
      details: {
        coordinationCost: supplierCoordinationCost,
        lostDiscounts: lostVolumeDiscounts,
      }
    },
    bomDisconnect: {
      label: 'BOM-Disconnect',
      value: bomDisconnectCost,
      percent: (bomDisconnectCost / totalCostOfFriction) * 100,
      color: '#ca8a04', // yellow-600
      details: {
        redesignCost: redesignCost,
        delayCost: productionDelayCost,
      }
    }
  }

  // ===== PRIORITY RECOMMENDATIONS =====
  const priorities = [
    { cluster: 'etoEngpass', cost: etoTotalCost },
    { cluster: 'pdfTrap', cost: pdfTrapCost },
    { cluster: 'darkPurchasing', cost: darkPurchasingCost },
    { cluster: 'bomDisconnect', cost: bomDisconnectCost },
  ].sort((a, b) => b.cost - a.cost)

  const recommendations = priorities.map((item, index) => {
    const clusterInfo = breakdown[item.cluster]
    return {
      priority: index + 1,
      cluster: clusterInfo.label,
      cost: item.cost,
      impact: clusterInfo.percent,
      solution: getSolutionForCluster(item.cluster),
    }
  })

  return {
    totalCostOfFriction,
    frictionAsPercentOfRevenue,
    annualRevenue,
    targetMargin,
    potentialMarginGain,
    newMargin,
    breakdown,
    recommendations,
    roi: {
      estimatedAnnualSavings,
      netAnnualSavings,
      roiMonths,
      roiPercent,
      setupCost: estimatedSetupCost,
    }
  }
}

function getSolutionForCluster(cluster) {
  const solutions = {
    etoEngpass: {
      title: 'Schnellere Angebote durch das Partflow-Netzwerk',
      description: 'Anfragen direkt an 200+ geprüfte Fertigungspartner weiterleiten — Angebote in 24h statt 5-15 Tage Wartezeit. So sinkt der Administrationsaufwand pro RFQ spürbar.',
      action: 'Partflow.net ansehen',
      link: 'https://www.partflow.net'
    },
    pdfTrap: {
      title: 'CAD-Dateien direkt einreichen',
      description: 'Partflow akzeptiert STEP, DXF und weitere CAD-Formate — keine manuelle Dateneingabe, keine Medienbrüche. Die automatische Fertigbarkeitsanalyse reduziert Rückfragen.',
      action: 'Mehr erfahren auf Partflow.net',
      link: 'https://www.partflow.net'
    },
    darkPurchasing: {
      title: 'Lieferanten bündeln statt verteilen',
      description: 'Ein Ansprechpartner bei Partflow koordiniert mehrere Fertigungspartner. Das reduziert Maverick Spend und schafft Transparenz über Preise und Lieferbedingungen.',
      action: 'Beschaffung vereinfachen',
      link: 'https://www.partflow.net'
    },
    bomDisconnect: {
      title: 'Frühe Verfügbarkeitsprüfung',
      description: 'Partflow prüft Rohmaterial- und Komponentenverfügbarkeit im Netzwerk — bevor es zum Produktionsproblem wird. So lassen sich Redesign-Zyklen durch bessere Planungsgrundlagen verringern.',
      action: 'Verfügbarkeit anfragen',
      link: 'https://www.partflow.net'
    }
  }

  return solutions[cluster]
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}


// Alias for backwards compatibility
export const calculateResults = calculateCostOfFriction
