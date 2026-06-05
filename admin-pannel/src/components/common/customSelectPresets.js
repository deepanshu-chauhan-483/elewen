export const CUSTOM_SELECT_LIST_CLASS =
  'hide-scrollbar max-h-[240px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export const CUSTOM_SELECT_LIST_PROPS = { 'data-lenis-prevent': true }

export const CUSTOM_SELECT_OPTION_HOVER = 'hover:bg-black hover:text-white'

export const selectPresets = {
  admin: {
    buttonClassName:
      'min-h-11 w-full rounded-3xl border border-[#94949433] bg-white px-4 pr-10 text-left text-sm text-[#2E2E2E] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:opacity-60',
    arrowClassName:
      'pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8F8F8F]',
    menuClassName:
      'fixed overflow-hidden rounded-2xl border border-[#94949433] bg-white p-1 shadow-[0_14px_32px_rgba(17,24,39,0.12)]',
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 whitespace-nowrap bg-white px-6 py-3 text-left text-[14px] leading-[18px] text-[#2E2E2E] transition-colors',
    selectedOptionClassName: '',
  },
}
