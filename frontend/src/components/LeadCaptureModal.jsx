import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const leadSchema = z.object({
  salutation: z.enum(['MR', 'MRS']),
  firstname: z.string().min(2, 'Vorname erforderlich'),
  lastName: z.string().min(2, 'Nachname erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  company_name: z.string().min(2, 'Firma erforderlich'),
  phone: z.string().optional(),
  opt_in: z.boolean(),
  opt_in_phone: z.boolean(),
})

export default function LeadCaptureModal({ onSubmit, onClose, isOpen, title }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      salutation: 'MR',
      firstname: '',
      lastName: '',
      email: '',
      company_name: '',
      phone: '',
      opt_in: false,
      opt_in_phone: false,
    }
  })

  const onSubmitForm = async (data) => {
    setIsSubmitting(true)

    try {
      // Fill hidden form with data
      const form = formRef.current
      form.salutation.value = data.salutation
      form.firstname.value = data.firstname
      form.lastName.value = data.lastName
      form.email.value = data.email
      form.company_name.value = data.company_name
      form.phone.value = data.phone || ''
      form.opt_in.checked = data.opt_in
      form.opt_in_phone.checked = data.opt_in_phone

      // Submit form to weclapp (in hidden iframe)
      form.submit()

      // Wait a moment for form submission
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Call parent callback with lead data (triggers PDF download)
      onSubmit(data)
    } catch (error) {
      console.error('Lead submission error:', error)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {title || '📊 Ihr Cost of Friction Report'}
              </h2>
              <p className="text-primary-100 text-sm">
                Für den Download benötigen wir noch ein paar Informationen
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-200 text-2xl font-bold leading-none"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* Hidden iframe for form submission */}
        <iframe
          name="hidden_iframe"
          id="hidden_iframe"
          style={{ display: 'none' }}
          onLoad={() => {
            console.log('Form successfully submitted to weclapp')
          }}
        />

        {/* Hidden weclapp form */}
        <form
          ref={formRef}
          method="post"
          action="https://dfsc.weclapp.com/webapp/seam/resource/rest/web2lead?charset=UTF-8"
          acceptCharset="UTF-8"
          target="hidden_iframe"
          style={{ display: 'none' }}
        >
          <input type="text" name="company_name" />
          <input type="text" name="email" />
          <select name="salutation">
            <option value="MR">Herr</option>
            <option value="MRS">Frau</option>
          </select>
          <input type="text" name="firstname" />
          <input type="text" name="lastName" />
          <input type="text" name="phone" />
          <input type="checkbox" name="opt_in" value="true" />
          <input type="checkbox" name="opt_in_phone" value="true" />
          <input type="hidden" name="honeypot" value="" />
          <input type="hidden" name="token" value="df1d12ea-1326-4b2b-bd4a-af2d23f83b08" />
        </form>

        {/* Visible React Hook Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-6">
          {/* Anrede */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Anrede *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="MR"
                  {...register('salutation')}
                  className="mr-2 w-4 h-4 text-primary-600"
                />
                <span className="text-gray-700">Herr</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="MRS"
                  {...register('salutation')}
                  className="mr-2 w-4 h-4 text-primary-600"
                />
                <span className="text-gray-700">Frau</span>
              </label>
            </div>
            {errors.salutation && (
              <p className="mt-1 text-sm text-red-600">{errors.salutation.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                type="text"
                {...register('firstname')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Max"
              />
              {errors.firstname && (
                <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mustermann"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* E-Mail */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              E-Mail-Adresse *
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="max.mustermann@firma.de"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Firma */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Firma *
            </label>
            <input
              type="text"
              {...register('company_name')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Musterfirma GmbH"
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          {/* Telefon (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon (optional)
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="+49 123 456789"
            />
          </div>

          {/* DSGVO Checkboxes */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Datenschutz & Kontakt
            </p>
            
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                {...register('opt_in')}
                className="mt-1 mr-3 w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Ich möchte per E-Mail von DFSC Engineering / Partflow.net kontaktiert werden und bin mit der Verarbeitung meiner Daten einverstanden.
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                {...register('opt_in_phone')}
                className="mt-1 mr-3 w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Ich möchte telefonisch von DFSC Engineering / Partflow.net kontaktiert werden.
              </span>
            </label>

            <p className="text-xs text-gray-500 mt-2">
              Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben. 
              Sie können Ihre Einwilligung jederzeit widerrufen.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </span>
              ) : (
                '📄 Report jetzt herunterladen'
              )}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            * Pflichtfelder
          </p>
        </form>
      </div>
    </div>
  )
}
