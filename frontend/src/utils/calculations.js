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

  const opportunityCostPerYear = rfqAdminCostPerYear * 0.5 // Simplified: lost innovation time

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
  const estimatedAnnualSavings = totalCostOfFriction * 0.70 // 70% reduction
  const estimatedSetupCost = 5000 // One-time setup
  const monthlySubscriptionCost = 0 // Partflow.net is free
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
      title: '24h Angebotszeit mit Partflow',
      description: 'Automatisierte Angebotserstellung statt 5-15 Tage Wartezeit. Kostenlose DFM-Analyse reduziert Revisions-Zyklen um 40%.',
      action: 'Partflow.net kostenlos testen',
      link: 'https://www.partflow.net'
    },
    pdfTrap: {
      title: 'Direkte CAD-Integration',
      description: 'Akzeptiert STEP-Dateien für direkten Import. Automatische Fertigbarkeitsanalyse eliminiert manuelles Abtippen.',
      action: 'CAD-Upload Demo ansehen',
      link: 'https://www.partflow.net'
    },
    darkPurchasing: {
      title: 'Single Point of Contact',
      description: 'Ein Ansprechpartner statt 5+ Lieferanten. Transparente Preisgestaltung und strukturierte Prozesse mit vollständiger Dokumentation.',
      action: 'Beschaffung konsolidieren',
      link: 'https://www.partflow.net'
    },
    bomDisconnect: {
      title: 'Frühe Machbarkeitsprüfung',
      description: 'Proaktive Kommunikation bei Sourcing-Herausforderungen. Materialverfügbarkeit durch europäisches Partnernetzwerk mit 200+ Lieferanten.',
      action: 'BOM-Check anfragen',
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
