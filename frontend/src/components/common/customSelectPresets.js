export const CUSTOM_SELECT_LIST_CLASS =
  'hide-scrollbar max-h-[240px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export const CUSTOM_SELECT_LIST_PROPS = { 'data-lenis-prevent': true }

/** Portal menus must sit above cards, map overlays, and package badges (z-30). */
export const CUSTOM_SELECT_MENU_Z = 'z-[500]'

/** Same hover on every dropdown option (all variants / pages). */
export const CUSTOM_SELECT_OPTION_HOVER = 'hover:bg-black hover:text-white'

/** Shared class bundles for CustomSelect variants */
export const selectPresets = {
  dashboard: {
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
  planner: {
    buttonClassName:
      'flex w-full min-h-[40px] min-w-0 items-center bg-transparent pr-8 text-left text-[16px] text-[#2D2D2D] outline-none disabled:cursor-not-allowed disabled:opacity-60',
    arrowClassName:
      'pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-[#2D2D2D]',
    menuClassName:
      `fixed ${CUSTOM_SELECT_MENU_Z} overflow-hidden border border-[#2D2D2D]/15 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]`,
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 whitespace-nowrap items-center bg-white px-4 py-3 text-left text-[16px] text-[#2D2D2D] transition-colors',
    selectedOptionClassName: '',
  },
  catering: {
    buttonClassName:
      'flex w-full min-w-0 items-center rounded-full border border-[#591902] bg-[#F8F4ED] px-4 py-2.5 pr-9 text-left text-[12px] text-[#591902] outline-none disabled:cursor-not-allowed disabled:opacity-60',
    arrowClassName:
      'pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#591902]',
    menuClassName:
      'fixed overflow-hidden rounded-xl border border-[#591902]/35 bg-[#F8F4ED] shadow-[0_10px_24px_rgba(89,25,2,0.12)]',
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 whitespace-nowrap bg-[#F8F4ED] px-4 py-2.5 text-left text-[12px] text-[#591902] transition-colors',
    selectedOptionClassName: 'bg-[#FBF6ED]',
  },
  filter: {
    buttonClassName:
      'flex h-[38px] min-w-0 w-full items-center rounded-full bg-[#F7F0E6] pl-4 pr-9 text-left text-[14px] leading-[18px] text-[#7A2B08] outline-none disabled:cursor-default disabled:opacity-100',
    arrowClassName:
      'pointer-events-none absolute right-3 top-1/2 h-3 w-3 shrink-0 -translate-y-1/2 text-[#7A2B08]',
    menuClassName:
      `fixed ${CUSTOM_SELECT_MENU_Z} overflow-hidden rounded-[16px] border border-[#7A2B08]/35 bg-[#F7F0E6] shadow-[0_10px_24px_rgba(0,0,0,0.16)]`,
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 whitespace-nowrap items-center bg-[#F7F0E6] px-6 py-3 text-left text-[14px] leading-[18px] text-[#7A2B08] transition-colors',
    selectedOptionClassName: '',
  },
  legal: {
    buttonClassName:
      'flex w-full min-w-0 items-center rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-left text-[14px] font-medium text-[#3a3a3a] outline-none',
    arrowClassName:
      'pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-[#3a3a3a]',
    menuClassName:
      'fixed overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]',
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 items-center bg-white px-4 py-3 text-left text-[14px] font-medium text-[#3a3a3a] transition-colors',
    selectedOptionClassName: 'bg-[#F7F7F7]',
  },
  sort: {
    buttonClassName:
      'flex h-9 w-full min-w-0 items-center rounded-full bg-[#D9D9D9] pl-4 pr-9 text-left text-[12px] text-[#2D2D2D] outline-none ring-1 ring-black/10',
    arrowClassName:
      'pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#2D2D2D]',
    menuClassName:
      `fixed ${CUSTOM_SELECT_MENU_Z} overflow-hidden rounded-[16px] border border-black/10 bg-[#D9D9D9] shadow-[0_10px_24px_rgba(0,0,0,0.16)]`,
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName:
      'flex w-full min-w-0 whitespace-nowrap items-center bg-[#D9D9D9] px-4 py-3 text-left text-[12px] text-[#2D2D2D] transition-colors',
    selectedOptionClassName: '',
  },
  form: {
    buttonClassName:
      'flex w-full min-w-0 items-center rounded-md border border-[#E5E5E5] bg-white p-3 pr-10 text-left text-[14px] text-[#364022] outline-none',
    arrowClassName: 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2',
    menuClassName:
      'fixed overflow-hidden rounded-md border border-[#E5E5E5] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.1)]',
    listClassName: CUSTOM_SELECT_LIST_CLASS,
    optionClassName: 'w-full px-3 py-2 text-left text-[13px] text-[#364022] transition-colors',
    selectedOptionClassName: 'bg-[#F5F2EC]',
  },
}
