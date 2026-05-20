# Elewen Admin Panel — Design Theme Reference

> Extracted from the user-dashboard source code. Use this as the single source of truth when building the admin panel to ensure visual consistency.

---

## 1. Color Palette

### Brand / Primary
| Name | Hex | Usage |
|---|---|---|
| Brand Brown (Dark) | `#591902` | Sidebar BG, navbar border, primary accent, active text |
| Brand Brown (Medium) | `#8C3B11` | Hover states, secondary accent |
| Brand Brown (Burnt) | `#7A2B08` | Tertiary button text, muted accents |
| Brand Gold (Primary) | `#CDB17E` | Primary button BG, highlights |
| Brand Gold (Light) | `#D4BA8E` | Hover gold variant |
| Brand Gold (Dark) | `#C6A15B` | Darker gold accents |

### Backgrounds
| Name | Hex | Usage |
|---|---|---|
| Page BG | `#FAFAFA` | Main content area, navbar BG |
| Off-white | `#F7F5F2` | Section backgrounds |
| Cream Light | `#F4EFE5` | Card / module backgrounds |
| Cream Warm | `#F7F4EE` | Hover states on light cards |
| Cream Soft | `#FBF7F3` | Subtle section tint |
| Light Gray | `#F3F3F3` | Secondary button BG, input fields |
| Mid Gray | `#E8E2DA` | Dividers, subtle borders |
| Active Sidebar Item | `#E7E0DA` | Sidebar nav active item BG |

### Text
| Name | Hex | Usage |
|---|---|---|
| Heading / Primary | `#1C1C1C` | Main headings |
| Body Text | `#2D2D2D` | Body content |
| Secondary Text | `#262626` | Icons, secondary labels |
| Muted Text | `#6B7280` | Placeholder, helper text |
| Faint Text | `#8F8F8F` | Timestamps, meta info |
| On-Dark Text | `#FAFAFA` | Text on sidebar / dark BG |

### Borders
| Name | Hex | Usage |
|---|---|---|
| Default Border | `#E4DED8` | Card, input, divider borders |
| Soft Border | `#E8E1D6` | Modal, panel borders |
| Dashed Border | `#D6CDC3` | Dashed separators |
| Accent Border | `#591902` | Navbar bottom border, focus ring |

### Status Colors
| State | Text Hex | BG Hex | Usage |
|---|---|---|---|
| Success | `#16A34A` | `#DDF7E5` | Active status badges |
| Info / Blue | `#0383E4` | `#DBEAFE` | Informational badges |
| Warning | `#C57A1E` | `#FCE7CF` | Pending/warning states |
| Error | `#8A1C1C` | `#FFF3F3` | Error messages, destructive actions |
| Neutral | `#4B5563` | `#E5E7EB` | Inactive / disabled states |

---

## 2. Typography

### Font Families
```css
--font-body:    'Poppins', sans-serif;
--font-display: 'Malgin', 'DM Serif Display', 'Playfair Display', Georgia, serif;
```
- **Body / UI text** → Poppins (used for labels, paragraphs, buttons, inputs)
- **Headings / Display** → Malgin / DM Serif Display (used for page titles, section headings)

### Font Sizes
| Label | Size | Usage |
|---|---|---|
| xs | `10px – 12px` | Timestamps, footnotes, badge labels |
| sm | `13px – 14px` | Helper text, table content, input labels |
| base | `15px – 16px` | Body text, button labels |
| md | `18px – 20px` | Card titles, subheadings |
| lg | `22px – 24px` | Section headings |
| xl | `28px – 32px` | Page headings |
| 2xl | `36px – 45px` | Dashboard hero numbers |
| 3xl | `52px+` | Landing / promotional display |

### Font Weights
| Weight | Value | Usage |
|---|---|---|
| Light | `300` | Decorative display text |
| Regular | `400` | Body copy |
| Medium | `500` | Labels, nav items |
| Semibold | `600` | Subheadings, button labels |
| Bold | `700` | Headings, emphasis |

### Letter Spacing
- Default: `normal`
- Subtle: `tracking-[0.08em]` — card subtitles
- Wide: `tracking-[0.16em]` — section labels / tags
- Extra Wide: `tracking-[0.18em]` — decorative uppercase text

---

## 3. Button Styles

### Sizes
| Size | Height | Padding | Font Size | Border Radius |
|---|---|---|---|---|
| Small | `32px` | `px-3 py-1.5` | `12px` | `rounded-[12px]` |
| Medium | `40px` | `px-5 py-2.5` | `14px` | `rounded-full` |
| Large | `48px` | `px-6 py-3` | `14px – 15px` | `rounded-full` |

### Variants
| Variant | Background | Text | Hover | Usage |
|---|---|---|---|---|
| Primary | `#CDB17E` | `#FAFAFA` | `#C7AA76` / opacity 90% | Main CTA, save actions |
| Secondary | `#F3F3F3` | `#262626` | `#E8E8E8` | Cancel, back, secondary actions |
| Tertiary | `#F7F0E6` | `#7A2B08` | slight darken | Soft accents |
| Danger | `#FFF3F3` | `#8A1C1C` | darken | Delete, destructive actions |
| Ghost | transparent | `#591902` | `bg-[#F4EFE5]` | Inline / text-only actions |

### Button States
```css
/* Disabled */
opacity: 0.7;
cursor: not-allowed;

/* Hover lift */
transform: translateY(-1px);

/* Hover scale */
transform: scale(1.05);

/* Focus ring */
outline: 2px solid #591902;
outline-offset: 2px;
```

---

## 4. Spacing System

### Gap (Flexbox / Grid)
| Token | Value | Usage |
|---|---|---|
| gap-1 | `4px` | Icon-to-label spacing |
| gap-2 | `8px` | Inline tag groups |
| gap-3 | `12px` | Form field groups |
| gap-4 | `16px` | Card content sections |
| gap-5 | `20px` | Standard component gap |
| gap-6 | `24px` | Sidebar nav items |
| gap-8 | `32px` | Between major sections |
| gap-10 | `40px` | Page-level sections |

### Padding — Horizontal
| Context | Value |
|---|---|
| Compact (badge, chip) | `px-3` (`12px`) |
| Standard input/button | `px-4 – px-5` (`16–20px`) |
| Card content | `px-5 – px-6` (`20–24px`) |
| Page container | `px-6 – px-10` (`24–40px`) |

### Padding — Vertical
| Context | Value |
|---|---|
| Chip / small badge | `py-1` (`4px`) |
| Button medium | `py-2.5` (`10px`) |
| Card | `py-4 – py-6` (`16–24px`) |
| Page section | `py-10 – py-16` (`40–64px`) |

---

## 5. Border Radius

| Label | Value | Usage |
|---|---|---|
| xs | `2px – 4px` | Tags, progress bars |
| sm | `6px – 8px` | Inputs, small cards |
| md | `12px – 16px` | Cards, panels |
| lg | `20px – 24px` | Modals, larger panels |
| xl | `28px` | Large modals |
| pill | `9999px` / `rounded-full` | Buttons, badges |
| circle | `50%` | Avatars, icon buttons |

---

## 6. Shadows

### Box Shadows
| Level | Value | Usage |
|---|---|---|
| Subtle | `0 1px 0 rgba(17,24,39,0.03)` | Table rows, list items |
| Light | `0 4px 12px rgba(0,0,0,0.18)` | Card hover |
| Medium | `0 6px 18px rgba(0,0,0,0.06)` | Default card shadow |
| Strong | `0 10px 24px rgba(0,0,0,0.12)` | Elevated panels |
| Heavy | `0 18px 40px rgba(0,0,0,0.16)` | Modals, drawers |
| Brand Light | `0 2px 16px rgba(89,25,2,0.06)` | Sidebar items |
| Brand Medium | `0 10px 24px rgba(117,72,33,0.05)` | Cards with brand tint |
| Brand Strong | `0 16px 38px rgba(111,76,43,0.14)` | Featured cards |

---

## 7. Layout Constants

### Dashboard Shell
```
Sidebar Width:  260px
Navbar Height:  63px
Mobile Bottom Bar Height: 63px
```

### Z-Index Stack
| Layer | Value | Element |
|---|---|---|
| Overlay / Backdrop | `z-40` | Modal overlays |
| Top modals | `z-50` | Dropdowns, tooltips |
| Fixed navbar | `z-20` | Admin topbar |
| Mobile bottom bar | `z-30` | Mobile nav |
| Content | `z-10` | Modal content |
| Base | `z-0` | Page content |

### Common Component Sizes
| Component | Value |
|---|---|
| Table row height | `48px – 56px` |
| Input height | `40px – 44px` |
| Card border radius | `16px` |
| Sidebar item padding | `px-4 py-3` |
| Sidebar item border radius | `rounded-xl` (12px) |
| Avatar small | `32px` |
| Avatar medium | `40px` |
| Avatar large | `56px` |

---

## 8. Animations & Transitions

### Standard Transitions
```css
/* Fast — hover states, badge color changes */
transition: all 0.22s ease;

/* Standard — sidebar open, dropdown reveal */
transition: all 0.32s ease;

/* Slow — page section reveal */
transition: all 0.55s ease;
```

### Easing Functions
```css
--ease-reveal:  cubic-bezier(0.16, 1, 0.3, 1);   /* smooth slide-in */
--ease-smooth:  cubic-bezier(0.22, 1, 0.36, 1);   /* smooth draw */
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1); /* bouncy enter */
```

### Hover Micro-interactions
```css
/* Lift on hover */
transform: translateY(-1px);

/* Scale on hover */
transform: scale(1.05);

/* Arrow icon rotate (CTA buttons) */
transform: rotate(45deg);
```

---

## 9. CSS Variables (Root)

```css
:root {
  --font-body:    'Poppins', sans-serif;
  --font-display: 'Malgin', 'DM Serif Display', 'Playfair Display', Georgia, serif;

  /* Brand */
  --color-brand-primary: #591902;
  --color-brand-gold:    #CDB17E;

  /* Backgrounds */
  --color-bg-page:   #FAFAFA;
  --color-bg-card:   #F4EFE5;
  --color-bg-input:  #F3F3F3;

  /* Text */
  --color-text-heading: #1C1C1C;
  --color-text-body:    #2D2D2D;
  --color-text-muted:   #6B7280;
  --color-text-on-dark: #FAFAFA;

  /* Layout */
  --sidebar-width:  260px;
  --navbar-height:  63px;
}
```

---

## 10. Recommended Admin Panel Layout

```
┌─────────────────────────────────────────────────────┐
│  Topbar (h=63px, bg=#FAFAFA, border-bottom=#591902) │
├────────────────┬────────────────────────────────────┤
│ Sidebar        │  Main Content Area                 │
│ w=260px        │  bg=#FAFAFA                        │
│ bg=#591902     │  px-6 py-8                         │
│ text=#FAFAFA   │                                    │
│                │  ┌──────┐ ┌──────┐ ┌──────┐       │
│ [Nav Items]    │  │ Stat │ │ Stat │ │ Stat │       │
│ active:        │  │ Card │ │ Card │ │ Card │       │
│   bg=#E7E0DA   │  └──────┘ └──────┘ └──────┘       │
│   text=#591902 │                                    │
│                │  ┌────────────────────────────┐    │
│                │  │  Data Table / Main View    │    │
│                │  └────────────────────────────┘    │
└────────────────┴────────────────────────────────────┘
```

### Sidebar Nav Item States
```
Default:  text=#FAFAFA,  bg=transparent
Hover:    text=#FAFAFA,  bg=rgba(255,255,255,0.1)
Active:   text=#591902,  bg=#E7E0DA, rounded-xl
```

---

## 11. Quick Reference Cheatsheet

```
PRIMARY ACTION BUTTON → bg:#CDB17E  text:#FAFAFA  rounded-full  px-5 py-2.5
SECONDARY BUTTON      → bg:#F3F3F3  text:#262626  rounded-full  px-5 py-2.5
DANGER BUTTON         → bg:#FFF3F3  text:#8A1C1C  rounded-full  px-5 py-2.5

PAGE HEADING  → font:Malgin  size:28-32px  weight:600  color:#1C1C1C
SECTION TITLE → font:Poppins size:20-24px  weight:600  color:#1C1C1C
BODY TEXT     → font:Poppins size:14-16px  weight:400  color:#2D2D2D
MUTED TEXT    → font:Poppins size:12-14px  weight:400  color:#6B7280

CARD          → bg:#FAFAFA  border:#E4DED8  radius:16px  shadow:0 6px 18px rgba(0,0,0,0.06)
INPUT         → bg:#F3F3F3  border:#E4DED8  radius:8px   height:40px  px-4
BADGE success → bg:#DDF7E5  text:#16A34A   radius:full
BADGE warning → bg:#FCE7CF  text:#C57A1E   radius:full
BADGE error   → bg:#FFF3F3  text:#8A1C1C   radius:full
```