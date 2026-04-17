export default function RepeatCustomizationPrompt({ onRepeat, onCreateNew }) {
  return (
    <div className="rounded-[10px] bg-[#E9D9C0] px-4 py-4">
      <p className="text-[14px] font-medium text-[#591902]">Repeat last used customization?</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRepeat}
          className="rounded-full bg-[#591902] px-5 py-2 text-[13px] font-semibold text-white"
        >
          Yes
        </button>

        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#591902]"
        >
          No, Add new customization
        </button>
      </div>
    </div>
  )
}
