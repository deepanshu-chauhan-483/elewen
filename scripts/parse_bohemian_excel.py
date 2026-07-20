#!/usr/bin/env python3
"""Parse Birthday Package- Bohemian .xlsx into JSON + Strapi seed JS."""

from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Birthday Package- Bohemian .xlsx"
JSON_OUT = ROOT / "tmp" / "bohemian_packages_parsed.json"
SEED_OUT = ROOT / "strapi" / "src" / "seed" / "decor-bohemian-packages.js"

# Skip incomplete / zero-price drafts in the workbook.
SKIP_SHEETS = {"FL 2", "FL 3.", "EH 3."}

# sheet -> (slug, title, theme_name, level, child_theme_slug)
# Slugs are bohemian-prefixed where needed to avoid House Party collisions
# (e.g. existing the-first-layer-*).
META: dict[str, tuple[str, str, str, str, str]] = {
    "FL 1": ("signs-and-stems-1", "Signs & Stems 1", "Signs & Stems", "level-1", "signs-and-stems"),
    "FL2": ("signs-and-stems-2", "Signs & Stems 2", "Signs & Stems", "level-2", "signs-and-stems"),
    "FL 3": ("signs-and-stems-3", "Signs & Stems 3", "Signs & Stems", "level-3", "signs-and-stems"),
    "PP 2": ("pampous-play-2", "Pampous Play 2", "Pampous Play", "level-2", "pampous-play"),
    "PP 3": ("pampous-play-3", "Pampous Play 3", "Pampous Play", "level-3", "pampous-play"),
    "PP3": ("less-is-more-3", "Less is More 3", "Less is More", "level-3", "less-is-more"),
    "Perch 1": ("perch-and-pour-1", "Perch & Pour 1", "Perch & Pour", "level-1", "perch-and-pour"),
    "Perch 2": ("perch-and-pour-2", "Perch & Pour 2", "Perch & Pour", "level-2", "perch-and-pour"),
    "Perch 3": ("perch-and-pour-3", "Perch & Pour 3", "Perch & Pour", "level-3", "perch-and-pour"),
    "EH 2": ("cozy-canopy-2", "Cozy Canopy 2", "Cozy Canopy", "level-2", "cozy-canopy"),
    "PIC 2": ("picnic-a-la-boho-2", "Picnic a la Boho 2", "Picnic a la Boho", "level-2", "picnic-a-la-boho"),
    "VV": ("vintage-vines-1", "Vintage Vines 1", "Vintage Vines", "level-1", "vintage-vines"),
    "CD 23": ("catching-dreams-2-3", "Catching Dreams 2/3", "Catching Dreams", "level-2", "catching-dreams"),
}

DEFAULT_NITTY = (
    "Love the look but need a different color? go ahead and book! "
    "We'll contact you to finalize the perfect shade from our available decor to match your vibe."
)
DEFAULT_SETUP = "A small area for our team to work, access to water and electricity."
PRICE_COVERS = [
    {"text": "The Complete Look"},
    {"text": "Professional Setup"},
    {"text": "No hidden service fees."},
]

# Card chips must stay short (Baby Shower / Pastel style).
SHORT_CARD_TAGS: dict[str, list[str]] = {
    "FL 1": [
        "1 entry easel",
        "1 entry board",
        "Entry flower decor",
        "5 wooden coasters",
        "5 floral vases",
    ],
    "FL2": [
        "1 entry easel",
        "1 entry board",
        "Entry flower decor",
        "6 wooden coasters",
        "3 floral vases",
        "3 candle florals",
    ],
    "FL 3": [
        "1 engraved mirror",
        "10 tealight holders",
        "Flower decor with disco balls",
        "6 wooden coasters",
        "3 floral vases",
        "3 candle florals",
    ],
    "PP 2": ["5 floral vase centrepieces", "4 metal floral standees"],
    "PP 3": ["Floral ring backdrop", "Custom neon sign", "4 metal floral standees"],
    "PP3": [
        "Happy birthday backdrop",
        "Real pampas decor",
        "1 easel",
        "Pampas signboard",
        "4 pampas standees",
    ],
    "Perch 1": ["Wooden bar", "4 cocktail tables", "Custom bar menu", "Bar neon sign"],
    "Perch 2": ["Cane lounge seating", "Basic bar + menu", "3 cocktail tables", "Bar neon sign"],
    "Perch 3": [
        "Cane lounge seating",
        "Round table + carpet",
        "Wooden bar with florals",
        "2 cocktail tables",
        "2 flower vases",
    ],
    "EH 2": [
        "Wooden canopy frame",
        "Bedsheet + mattress",
        "Dreamcatcher hanging",
        "2 low puffies",
        "Cushions",
        "2 rattan stools",
    ],
    "PIC 2": [
        "Picnic mattress setup",
        "8-seater long table",
        "Cushions + placemats",
        "4 flower vases",
        "Backdrop with decor",
    ],
    "VV": ["Wooden ladder", "Flower vine decor", "Bohemian backdrop", "Neon sign"],
    "CD 23": [
        "Dreamcatcher backdrop",
        "Wooden structure",
        "Pampas + fabric decor",
        "4 floral vases",
        "2 lanterns",
        "Return favors stand",
    ],
}

SECTION_STOPS = [
    "What's Included",
    "Whats Included",
    "Nitty - Gritties",
    "Nitty-Gritties",
    "The price you see covers it all",
    "Best placed",
    "Why we love",
    "Setup",
    "Policies",
    "Cancellation",
    "Reference",
    "Not included",
    "Optional Add on",
]


def norm(value: object) -> str:
    if value is None:
        return ""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n").strip()
    return re.sub(r"[ \t]+", " ", text)


def amt(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    text = (
        norm(value)
        .replace(",", "")
        .replace("₹", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .replace("INR", "")
    )
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group(0)) if match else None


def find_label(ws, labels: list[str], start: int = 1) -> int | None:
    targets = {label.lower().rstrip(":") for label in labels}
    for row in range(start, (ws.max_row or 1) + 1):
        cell = norm(ws.cell(row, 1).value).lower().rstrip(":")
        if cell in targets:
            return row
    return None


def amount_on_row(ws, row: int) -> float | None:
    for col in range(2, 8):
        value = amt(ws.cell(row, col).value)
        if value is not None:
            return value
    return None


def section_after(ws, labels: list[str], stop_labels: list[str]) -> str:
    row = find_label(ws, labels)
    if row is None:
        return ""
    stops = {label.lower().rstrip(":") for label in stop_labels}
    lines: list[str] = []
    for next_row in range(row + 1, (ws.max_row or row) + 1):
        text = norm(ws.cell(next_row, 1).value)
        if not text:
            continue
        key = text.lower().rstrip(":")
        if key in stops or any(key.startswith(stop) for stop in stops):
            break
        if key == "description":
            continue
        lines.append(text)
    return "\n".join(lines)


def clean_prose(text: str, fallback: str = "") -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return fallback

    lower = cleaned.lower()
    cut_markers = [
        " policies ",
        "policies all the material",
        "cancellation policy",
        "read our full",
        "[read our",
        "reference picture",
    ]
    for marker in cut_markers:
        idx = lower.find(marker)
        if idx > 0:
            cleaned = cleaned[:idx].strip(" .")
            break

    return cleaned[:500] if cleaned else fallback


def js_string(value: str) -> str:
    escaped = (
        value.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\n", "\\n")
        .replace("\r", "")
    )
    return "'%s'" % escaped


def parse_sheet(ws, sheet_name: str, meta: tuple[str, str, str, str, str]) -> dict:
    slug, title, theme_name, level, child = meta
    package_price = platform = labour = total = None

    for row in range(1, (ws.max_row or 1) + 1):
        label = norm(ws.cell(row, 1).value).lower().rstrip(":")
        if label == "package price":
            package_price = amount_on_row(ws, row)
        elif "transport" in label and "labour" in label:
            labour = amount_on_row(ws, row)
        elif label == "platform fee":
            platform = amount_on_row(ws, row)
        elif label.startswith("total price"):
            total = amount_on_row(ws, row)

    desc_raw = section_after(ws, ["Description", "Description "], SECTION_STOPS)
    description = clean_prose(
        " ".join(
            line for line in desc_raw.split("\n") if line and not line.startswith("-")
        ).strip(),
        title,
    )

    inclusions = list(SHORT_CARD_TAGS.get(sheet_name, []))

    nitty = section_after(
        ws,
        ["Nitty - Gritties", "Nitty-Gritties", "Nitty Gritties"],
        SECTION_STOPS,
    )
    nitty = clean_prose(" ".join(nitty.split("\n")).strip(), DEFAULT_NITTY)

    best = section_after(
        ws,
        ["Best placed at", "Best placed", "Best Placed At"],
        SECTION_STOPS,
    )
    best = clean_prose(" ".join(best.split("\n")).strip(), "")

    why = section_after(
        ws,
        ["Why we love it", "Why we love", "Why We Love It"],
        SECTION_STOPS,
    )
    why = clean_prose(" ".join(why.split("\n")).strip(), "")

    setup = section_after(
        ws,
        ["Setup needs", "Setup", "Set up needs"],
        SECTION_STOPS,
    )
    setup = clean_prose(
        " ".join(
            line for line in setup.split("\n") if not line.lower().startswith("the price")
        ).strip(),
        DEFAULT_SETUP,
    )

    breakdown: list[dict[str, int]] = []
    for row in range(3, 50):
        label = norm(ws.cell(row, 1).value).lower().rstrip(":")
        if (
            label in ("package price", "platform fee")
            or label.startswith("total price")
            or ("transport" in label and "labour" in label)
        ):
            break
        detail = norm(ws.cell(row, 2).value)
        cost = amt(ws.cell(row, 3).value)
        if (
            detail
            and cost is not None
            and cost >= 100
            and detail.lower() not in ("details", "vendor cost", "average")
        ):
            breakdown.append({"label": detail[:80], "amount": int(round(cost))})

    if platform is not None:
        breakdown.append({"label": "Platform fee", "amount": int(round(platform))})
    if labour is not None:
        breakdown.append({"label": "Labour & Transport", "amount": int(round(labour))})

    if total is not None and total > 0:
        base_price = int(round(total))
    else:
        base_price = int(round((package_price or 0) + (platform or 0) + (labour or 0)))

    if base_price <= 0:
        raise ValueError("Sheet %s has no usable total price" % sheet_name)

    return {
        "sheet": sheet_name,
        "title": title,
        "slug": slug,
        "theme_name": theme_name,
        "budget_level_slug": level,
        "base_price": base_price,
        "description": description[:1000],
        "key_decor_elements": description[:180],
        "nitty_gritty": nitty[:800],
        "setup_needs": setup[:500],
        "best_placed_at": best[:500],
        "why_we_love_it": why[:500],
        "child_theme": child,
        "price_breakdown": breakdown,
        "inclustions": inclusions[:12],
    }


def render_seed(packages: list[dict]) -> str:
    chunks: list[str] = [
        "'use strict';",
        "",
        "const {",
        "  ensureBudgetLevelDocumentId,",
        "  ensureEventDocumentId,",
        "  ensureThemeDocumentId,",
        "  seedDecorPackages,",
        "} = require('./decor-proposal-shared');",
        "",
        "const EVENT_SLUG_CANDIDATES = [",
        "  'birthday-parties',",
        "  'birthday-celebrations',",
        "  'birthday',",
        "  'birthday-party',",
        "];",
        "",
        "const BOHEMIAN_PACKAGES = [",
    ]

    for pkg in packages:
        lines = ["  {"]
        lines.append("    sheet: %s," % js_string(pkg["sheet"]))
        lines.append("    title: %s," % js_string(pkg["title"]))
        lines.append("    slug: %s," % js_string(pkg["slug"]))
        lines.append("    theme_name: %s," % js_string(pkg["theme_name"]))
        lines.append("    budget_level_slug: %s," % js_string(pkg["budget_level_slug"]))
        lines.append("    base_price: %s," % pkg["base_price"])
        lines.append("    description: %s," % js_string(pkg["description"]))
        lines.append("    key_decor_elements: %s," % js_string(pkg["key_decor_elements"]))
        lines.append("    nitty_gritty: %s," % js_string(pkg["nitty_gritty"]))
        lines.append("    setup_needs: %s," % js_string(pkg["setup_needs"]))
        lines.append("    best_placed_at: %s," % js_string(pkg["best_placed_at"]))
        lines.append("    why_we_love_it: %s," % js_string(pkg["why_we_love_it"]))
        lines.append(
            "    theme_slug_candidates: ['bohemian', %s],"
            % js_string(pkg["child_theme"])
        )
        lines.append("    price_covers: [")
        for cover in PRICE_COVERS:
            lines.append("      { text: %s }," % js_string(cover["text"]))
        lines.append("    ],")
        lines.append("    price_breakdown: [")
        for item in pkg["price_breakdown"]:
            lines.append(
                "      { label: %s, amount: %s },"
                % (js_string(item["label"]), item["amount"])
            )
        lines.append("    ],")
        lines.append("    inclustions: [")
        for text in pkg["inclustions"]:
            lines.append(
                "      { text: %s, group_title: 'Includes' }," % js_string(text)
            )
        lines.append("    ],")
        lines.append("  },")
        chunks.append("\n".join(lines))

    chunks.extend(
        [
            "];",
            "",
            "async function seedDecorBohemianPackages(strapi) {",
            "  await ensureThemeDocumentId(strapi, { name: 'Bohemian', slug: 'bohemian', display_order: 50 });",
            "  await ensureEventDocumentId(strapi, {",
            "    name: 'Birthday Parties',",
            "    slugCandidates: EVENT_SLUG_CANDIDATES,",
            "    display_order: 10,",
            "  });",
            "  await ensureBudgetLevelDocumentId(strapi, {",
            "    name: 'Level 1',",
            "    slug: 'level-1',",
            "    display_order: 1,",
            "    description: 'Thoughtfully put together essentials for smaller guest counts.',",
            "  });",
            "  await ensureBudgetLevelDocumentId(strapi, {",
            "    name: 'Level 2',",
            "    slug: 'level-2',",
            "    display_order: 2,",
            "    description: 'A more detailed setup with a stronger visual and service experience.',",
            "  });",
            "  await ensureBudgetLevelDocumentId(strapi, {",
            "    name: 'Level 3',",
            "    slug: 'level-3',",
            "    display_order: 3,",
            "    description: 'Premium styling and service depth for larger or more layered celebrations.',",
            "  });",
            "",
            "  return seedDecorPackages(strapi, BOHEMIAN_PACKAGES, {",
            "    eventSlugCandidates: EVENT_SLUG_CANDIDATES,",
            "    logPrefix: 'seed/decor-bohemian',",
            "    refreshExistingDecor: true,",
            "  });",
            "}",
            "",
            "module.exports = {",
            "  BOHEMIAN_PACKAGES,",
            "  EVENT_SLUG_CANDIDATES,",
            "  seedDecorBohemianPackages,",
            "};",
            "",
        ]
    )
    return "\n".join(chunks)


def main() -> None:
    workbook = load_workbook(XLSX, data_only = True)
    packages: list[dict] = []
    seen_slugs: set[str] = set()

    for sheet_name, meta in META.items():
        if sheet_name in SKIP_SHEETS:
            continue
        if sheet_name not in workbook.sheetnames:
            raise SystemExit("Missing sheet: %s" % sheet_name)

        pkg = parse_sheet(workbook[sheet_name], sheet_name, meta)
        if pkg["slug"] in seen_slugs:
            raise SystemExit("Duplicate slug generated: %s" % pkg["slug"])
        seen_slugs.add(pkg["slug"])
        packages.append(pkg)

    JSON_OUT.parent.mkdir(parents = True, exist_ok = True)
    JSON_OUT.write_text(json.dumps(packages, indent = 2, ensure_ascii = False), encoding = "utf-8")
    SEED_OUT.write_text(render_seed(packages), encoding = "utf-8")

    print("wrote %s (%s packages)" % (SEED_OUT, len(packages)))
    for pkg in packages:
        print(
            "%s %s price=%s tags=%s"
            % (pkg["sheet"], pkg["slug"], pkg["base_price"], len(pkg["inclustions"]))
        )


if __name__ == "__main__":
    main()
