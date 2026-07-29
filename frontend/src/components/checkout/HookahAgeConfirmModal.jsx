export default function HookahAgeConfirmModal({ open, onClose, onConfirm, isSubmitting = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hookah-age-title"
      >
        <h3 id="hookah-age-title" className="text-[18px] font-semibold text-[#2C2C2C]">
          Age confirmation
        </h3>
        <p className="mt-3 text-[14px] leading-[1.6] text-[#5A5A5A]">
          Hookah service is available for guests aged 18 and above. By confirming, you declare that
          you and all guests receiving this service are 18+.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-[#D9D0C5] px-5 py-2 text-[13px] font-medium text-[#591902] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-full bg-[#591902] px-5 py-2 text-[13px] font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Confirming...' : 'I am 18 or older'}
          </button>
        </div>
      </div>
    </div>
  )
}
