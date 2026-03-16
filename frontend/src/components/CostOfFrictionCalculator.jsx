import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const calculatorSchema = z.object({
  // Company Data
  annualRevenue: z.number().min(10000, 'Bitte geben Sie einen gültigen Umsatz ein'),
  targetMargin: z.number().min(0).max(100),
  
  // ETO-Vertriebs-Engpass (Orange)
  rfqPerMonth: z.number().min(0),
  hoursPerRfq: z.number().min(0),
  percentAdminTime: z.number().min(0).max(100),
  engineerHourlyRate: z.number().min(0),
  
  // PDF-Falle (Red)
  drawingsPerMonth: z.number().min(0),
  minutesPerDrawing: z.number().min(0),
  technicianHourlyRate: z.number().min(0),
  
  // Dark Purchasing (Purple)
  suppliersManaged: z.number().min(0),
  hoursSupplierCoordination: z.number().min(0),
  annualProcurementVolume: z.number().min(0),
  mavericksSpendPercent: z.number().min(0).max(100),
  
  // BOM-Disconnect (Yellow)
  redesignCyclesPerYear: z.number().min(0),
  costPerRedesignCycle: z.number().min(0),
  productionDelayDays: z.number().min(0),
  dailyProductionValue: z.number().min(0),
})

export default function CostOfFrictionCalculator({ onCalculate }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      // Company Data - Optimiert für kleinere Unternehmen (500K€)
      annualRevenue: 500000,
      targetMargin: 12,
      
      // ETO-Vertriebs-Engpass (Orange)
      rfqPerMonth: 15,
      hoursPerRfq: 3,
      percentAdminTime: 25,
      engineerHourlyRate: 55,
      
      // PDF-Falle (Red)
      drawingsPerMonth: 40,
      minutesPerDrawing: 10,
      technicianHourlyRate: 40,
      
      // Dark Purchasing (Purple)
      suppliersManaged: 5,
      hoursSupplierCoordination: 10,
      annualProcurementVolume: 200000,
      mavericksSpendPercent: 15,
      
      // BOM-Disconnect (Yellow)
      redesignCyclesPerYear: 4,
      costPerRedesignCycle: 3500,
      productionDelayDays: 3,
      dailyProductionValue: 1500,
    }
  })

  const onSubmit = (data) => {
    onCalculate(data)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Cost of Friction Rechner für Fertigungsbetriebe
        </h2>
        <p className="text-gray-600 text-lg">
          Ermitteln Sie versteckte Kosten in Ihrer industriellen Wertschöpfungskette und identifizieren Sie Margenpotenziale durch operative Reibung.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          ⏱️ Dauert nur 5 Minuten • 💰 Zeigt sofort Einsparpotenziale • 📊 Kostenlose Analyse
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Unternehmensdaten */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900">Unternehmensdaten</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Grundlegende Kennzahlen Ihres Fertigungsunternehmens für präzise Kostenanalyse
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jahresumsatz (€)
              </label>
              <input
                type="number"
                {...register('annualRevenue', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="500000"
              />
              {errors.annualRevenue && (
                <p className="mt-1 text-sm text-red-600">{errors.annualRevenue.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ziel-Marge (%)
              </label>
              <input
                type="number"
                {...register('targetMargin', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="12"
              />
              {errors.targetMargin && (
                <p className="mt-1 text-sm text-red-600">{errors.targetMargin.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: ETO-Vertriebs-Engpass */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border-l-4 border-orange-500">
          <div className="flex items-center mb-4">
            <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900">ETO-Vertriebs-Engpass</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Angebotsmanagement bei Engineer-to-Order: Wie viel Zeit kostet die manuelle Angebotserstellung?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anfragen pro Monat
              </label>
              <input
                type="number"
                {...register('rfqPerMonth', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                placeholder="15"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stunden pro Anfrage
              </label>
              <input
                type="number"
                {...register('hoursPerRfq', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin-Aufwand (%)
              </label>
              <input
                type="number"
                {...register('percentAdminTime', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stundensatz Ingenieur (€)
              </label>
              <input
                type="number"
                {...register('engineerHourlyRate', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                placeholder="55"
              />
            </div>
          </div>
        </div>

        {/* Section 3: PDF-Falle */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border-l-4 border-red-500">
          <div className="flex items-center mb-4">
            <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-900">PDF-Falle</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Manuelles Abtippen von technischen Zeichnungen: Der versteckte Kostentreiber in der Fertigung
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zeichnungen pro Monat
              </label>
              <input
                type="number"
                {...register('drawingsPerMonth', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-400"
                placeholder="40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minuten pro Zeichnung
              </label>
              <input
                type="number"
                {...register('minutesPerDrawing', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-400"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stundensatz Techniker (€)
              </label>
              <input
                type="number"
                {...register('technicianHourlyRate', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-400"
                placeholder="40"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dark Purchasing */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3">
              4
            </div>
            <h3 className="text-xl font-bold text-gray-900">Dark Purchasing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Dezentraler Einkauf ohne Volumenbündelung: Wie viel Geld verschenken Sie an Ihre Lieferanten?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anzahl Lieferanten
              </label>
              <input
                type="number"
                {...register('suppliersManaged', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Koordination Stunden/Monat
              </label>
              <input
                type="number"
                {...register('hoursSupplierCoordination', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Beschaffungsvolumen (€/Jahr)
              </label>
              <input
                type="number"
                {...register('annualProcurementVolume', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
                placeholder="200000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maverick Spend (%)
              </label>
              <input
                type="number"
                {...register('mavericksSpendPercent', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400"
                placeholder="15"
              />
            </div>
          </div>
        </div>

        {/* Section 5: BOM-Disconnect */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border-l-4 border-yellow-500">
          <div className="flex items-center mb-4">
            <div className="bg-yellow-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3">
              5
            </div>
            <h3 className="text-xl font-bold text-gray-900">BOM-Disconnect</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Änderungen in der Stückliste ohne Echtzeit-Synchronisation: Teure Redesigns und Produktionsverzögerungen
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Redesign-Zyklen/Jahr
              </label>
              <input
                type="number"
                {...register('redesignCyclesPerYear', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
                placeholder="4"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kosten pro Redesign (€)
              </label>
              <input
                type="number"
                {...register('costPerRedesignCycle', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
                placeholder="3500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Produktionsverzögerung (Tage)
              </label>
              <input
                type="number"
                {...register('productionDelayDays', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Täglicher Produktionswert (€)
              </label>
              <input
                type="number"
                {...register('dailyProductionValue', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-lg"
          >
            🔍 Jetzt Cost of Friction berechnen
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          ✓ Keine Anmeldung erforderlich • ✓ Sofortiges Ergebnis • ✓ 100% kostenlos
        </p>
      </form>
    </div>
  )
}
