#!/usr/bin/env python3
"""Generate Strapi decor seed JS modules from tmp/excel_package_summary.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUMMARY_PATH = ROOT / "tmp" / "excel_package_summary.json"
OUT_DIR = ROOT / "strapi" / "src" / "seed" / "generated"

SKIP_SHEETS = {
    "CP",
    "IS 2",
    "IS 3",
    "Add on",
}

# (workbook filename, sheet key lower) -> meta
SHEET_META: dict[tuple[str, str], tuple[str, str, str, str, str]] = {
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "gt 1"): ("golden-touch-1", "The Golden Touch 1", "The Golden Touch", "level-1", "golden-touch"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "gt 2"): ("golden-touch-2", "The Golden Touch 2", "The Golden Touch", "level-2", "golden-touch"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "gt 23"): ("golden-touch-2-3", "The Golden Touch 2/3", "The Golden Touch", "level-2", "golden-touch"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "gt 3"): ("golden-touch-3", "The Golden Touch 3", "The Golden Touch", "level-3", "golden-touch"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "ss 1"): ("social-setup-1", "The Social Setup 1", "The Social Setup", "level-1", "social-setup"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "ss2"): ("social-setup-2", "The Social Setup 2", "The Social Setup", "level-2", "social-setup"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "ss 23"): ("social-setup-2-3", "The Social Setup 2/3", "The Social Setup", "level-2", "social-setup"),
    ("Birthday _ Anniversary - Bubbles & Black Tie.xlsx", "ss3"): ("social-setup-3", "The Social Setup 3", "The Social Setup", "level-3", "social-setup"),
    ("Engagement - Sufi Night Package.xlsx", "is 1"): ("ishq-sufiyana-1", "Ishq Sufiyana 1", "Ishq Sufiyana", "level-1", "ishq-sufiyana"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "pp1"): ("phool-proof-1", "Phool-Proof 1", "Phool-Proof", "level-1", "phool-proof"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "pp2"): ("phool-proof-2", "Phool-Proof 2", "Phool-Proof", "level-2", "phool-proof"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "awg1"): ("air-we-go-1", "Air We Go 1", "Air We Go", "level-1", "air-we-go"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "awg2"): ("air-we-go-2", "Air We Go 2", "Air We Go", "level-2", "air-we-go"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "awg23"): ("air-we-go-2-3", "Air We Go 2/3", "Air We Go", "level-2", "air-we-go"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "awg 3"): ("air-we-go-3", "Air We Go 3", "Air We Go", "level-3", "air-we-go"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "tfl1"): ("the-first-layer-1", "The First Layer 1", "The First Layer", "level-1", "the-first-layer"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "tfl2"): ("the-first-layer-2", "The First Layer 2", "The First Layer", "level-2", "the-first-layer"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "tfl 3"): ("the-first-layer-3", "The First Layer 3", "The First Layer", "level-3", "the-first-layer"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "rtb1"): ("raise-the-bar-1", "Raise the Bar 1", "Raise the Bar", "level-1", "raise-the-bar"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "rtb 1"): ("raise-the-bar-1b", "Raise the Bar 1B", "Raise the Bar", "level-1", "raise-the-bar"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "rtb 2"): ("raise-the-bar-2", "Raise the Bar 2", "Raise the Bar", "level-2", "raise-the-bar"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "rtb 23"): ("raise-the-bar-2-3", "Raise the Bar 2/3", "Raise the Bar", "level-2", "raise-the-bar"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "rtb 3"): ("raise-the-bar-3", "Raise the Bar 3", "Raise the Bar", "level-3", "raise-the-bar"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "jem1"): ("just-enough-magic-1", "Just Enough Magic 1", "Just Enough Magic", "level-1", "just-enough-magic"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "jem2"): ("just-enough-magic-2", "Just Enough Magic 2", "Just Enough Magic", "level-2", "just-enough-magic"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "jem 3"): ("just-enough-magic-3", "Just Enough Magic 3", "Just Enough Magic", "level-3", "just-enough-magic"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ps1"): ("party-smart-1", "Party Smart 1", "Party Smart", "level-1", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ps2"): ("party-smart-2", "Party Smart 2", "Party Smart", "level-2", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ps 23"): ("party-smart-2-3", "Party Smart 2/3", "Party Smart", "level-2", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ps 3"): ("party-smart-3", "Party Smart 3", "Party Smart", "level-3", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ss 2"): ("party-smart-social-2", "Party Smart Social 2", "Party Smart", "level-2", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "ss3"): ("party-smart-social-3", "Party Smart Social 3", "Party Smart", "level-3", "party-smart"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "aa1"): ("entry-setup-aarambh-1", "Entry Setup Aarambh 1", "Aarambh", "level-1", "aarambh"),
    ("General Pack _ House Party _ Birthday Party.xlsx", "au1"): ("aura-upgrade-1", "Aura Upgrade 1", "Aura Upgrade", "level-1", "aura-upgrade"),
}

WORKBOOK_GROUPS = {
    "Birthday _ Anniversary - Bubbles & Black Tie.xlsx": {
        "module": "decor-bubbles-black-tie-packages.js",
        "export_name": "BUBBLES_BLACK_TIE_PACKAGES",
        "seed_fn": "seedDecorBubblesBlackTiePackages",
        "event_slugs": [
            "birthday-parties",
            "birthday-celebrations",
            "birthday",
            "anniversary",
            "anniversary-evenings",
            "anniversaries",
        ],
        "log_prefix": "seed/decor-bubbles-black-tie",
    },
    "Engagement - Sufi Night Package.xlsx": {
        "module": "decor-sufi-night-packages.js",
        "export_name": "SUFI_NIGHT_PACKAGES",
        "seed_fn": "seedDecorSufiNightPackages",
        "event_slugs": [
            "engagement-parties",
            "engagement",
            "engagements",
            "proposal",
            "proposals",
        ],
        "log_prefix": "seed/decor-sufi-night",
    },
    "General Pack _ House Party _ Birthday Party.xlsx": {
        "module": "decor-house-party-birthday-packages.js",
        "export_name": "HOUSE_PARTY_BIRTHDAY_PACKAGES",
        "seed_fn": "seedDecorHousePartyBirthdayPackages",
        "event_slugs": [
            "birthday-parties",
            "birthday-celebrations",
            "birthday",
            "house-party",
            "house-parties",
        ],
        "log_prefix": "seed/decor-house-party-birthday",
    },
}

BACHELORETTE_PRICE_COVERS = [
    {"text": "The Complete Look"},
    {"text": "Professional Setup"},
    {"text": "No hidden service fees."},
]

DEFAULT_NITTY = (
    "Love the look but need a different color story? Go ahead and book! "
    "We will contact you to finalize the perfect shade from our available decor to match your vibe."
)


def js_string(value: str) -> str:
    """Escape string for JS single-quoted literal."""
    text = str(value or "").replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
    return "'%s'" % text


def strip_section_prefix(text: str) -> str:
    """Remove Best placed / Why we love labels from cell text."""
    cleaned = str(text or "").strip()
    cleaned = re.sub(r"^(Best Placed At|Best placed at|Why We Love It|Why we Love it)\s*:?\s*", "", cleaned, flags = re.I)
    return cleaned.strip()


def includes_to_inclusions(includes_text: str) -> list[dict[str, str]]:
    """Split includes blob into inclusion rows."""
    if not includes_text:
        return []
    chunks = re.split(r"\n\s*\n|\n(?=[A-Z][^a-z]{2,})", includes_text)
    rows: list[dict[str, str]] = []
    group = "Includes"
    for chunk in chunks:
        line = chunk.strip()
        if not line or len(line) < 4:
            continue
        if line.endswith(":") and len(line) < 80:
            group = line.rstrip(":")
            continue
        rows.append({"text": line, "group_title": group})
        if len(rows) >= 24:
            break
    return rows


def build_price_breakdown(pkg: dict) -> list[dict[str, float]]:
    """Build price breakdown from line items and fee rows."""
    breakdown: list[dict[str, float]] = []
    skip_labels = {"level 1", "level 2", "level 3", "the golden touch", "details"}
    for item in pkg.get("line_items") or []:
        label = str(item.get("label") or "").strip()
        amount = item.get("amount")
        if amount is None:
            continue
        if amount < 100 and "choose" not in label.lower():
            continue
        breakdown.append({"label": label, "amount": float(amount)})
    platform = pkg.get("platform_fee")
    transport = pkg.get("transport_labour")
    if platform is not None:
        breakdown.append({"label": "Platform fee", "amount": float(platform)})
    if transport is not None:
        breakdown.append({"label": "Labour & Transport", "amount": float(transport)})
    return breakdown


def resolve_au1_total() -> float:
    """AU1 sheet uses average tier — use upper tier + fees."""
    decor = 8500.0
    platform = decor * 0.1
    transport = 600.0
    return decor + platform + transport


def package_to_seed(pkg: dict, sheet_key: str, workbook_file: str) -> dict | None:
    """Map parsed summary package to seed object."""
    if pkg.get("sheet_name", "").strip() in SKIP_SHEETS:
        return None
    meta = SHEET_META.get((workbook_file, sheet_key))
    if not meta:
        return None

    slug, title, theme_name, budget_level, theme_slug = meta
    total_price = pkg.get("total_price")
    if total_price is None and sheet_key == "au1":
        total_price = resolve_au1_total()
    if total_price is None or float(total_price) <= 0:
        return None
    if sheet_key == "is 2" or sheet_key == "is 3":
        return None

    description = pkg.get("description") or title
    key_decor = description
    why = strip_section_prefix(pkg.get("why_we_love_it") or "")
    best = strip_section_prefix(pkg.get("best_placed") or "")
    setup = pkg.get("setup") or "A small area for our team to work, access to water and electricity."
    nitty = (pkg.get("nitty_gritty") or DEFAULT_NITTY).strip()

    inclustions = includes_to_inclusions(pkg.get("includes") or "")
    if not inclustions and pkg.get("includes"):
        inclustions = [{"text": str(pkg.get("includes"))[:500], "group_title": "Includes"}]

    price_breakdown = build_price_breakdown(pkg)
    addons = []
    for addon in pkg.get("addons") or []:
        label = str(addon.get("label") or "").strip()
        if not label:
            continue
        addons.append(
            {
                "name": label,
                "price": float(addon.get("amount") or 0),
                "description": str(addon.get("details") or label),
                "visibility": True,
            }
        )

    seed = {
        "sheet": pkg.get("sheet_name"),
        "title": title,
        "slug": slug,
        "theme_name": theme_name,
        "theme_slug_candidates": [theme_slug, "bubbles-and-black-tie"]
        if workbook_file.endswith("Bubbles & Black Tie.xlsx")
        else [theme_slug],
        "budget_level_slug": budget_level,
        "base_price": float(total_price),
        "description": description,
        "key_decor_elements": key_decor[:500],
        "nitty_gritty": nitty[:800],
        "price_covers": BACHELORETTE_PRICE_COVERS,
        "setup_needs": setup[:500],
        "best_placed_at": best[:500] if best else "Indoor or outdoor celebration spaces suited to your guest size.",
        "why_we_love_it": why[:500] if why else "A thoughtfully styled setup that elevates the celebration without overwhelming the space.",
        "price_breakdown": price_breakdown,
        "inclustions": inclustions,
    }
    if addons:
        seed["addons"] = addons
    return seed


def render_package_js(pkg: dict) -> str:
    """Render one package object as JS literal."""
    lines = ["  {"]
    simple_keys = [
        "sheet",
        "title",
        "slug",
        "theme_name",
        "budget_level_slug",
        "base_price",
        "description",
        "key_decor_elements",
        "nitty_gritty",
        "setup_needs",
        "best_placed_at",
        "why_we_love_it",
    ]
    for key in simple_keys:
        val = pkg.get(key)
        if key == "base_price":
            lines.append("    %s: %s," % (key, val))
        else:
            lines.append("    %s: %s," % (key, js_string(val)))

    lines.append("    theme_slug_candidates: [%s]," % ", ".join(js_string(s) for s in pkg.get("theme_slug_candidates") or []))
    lines.append("    price_covers: [")
    for cover in pkg.get("price_covers") or []:
        lines.append("      { text: %s }," % js_string(cover.get("text")))
    lines.append("    ],")

    lines.append("    price_breakdown: [")
    for row in pkg.get("price_breakdown") or []:
        lines.append("      { label: %s, amount: %s }," % (js_string(row["label"]), row["amount"]))
    lines.append("    ],")

    lines.append("    inclustions: [")
    for row in pkg.get("inclustions") or []:
        lines.append("      { text: %s, group_title: %s }," % (js_string(row["text"]), js_string(row.get("group_title"))))
    lines.append("    ],")

    if pkg.get("addons"):
        lines.append("    addons: [")
        for addon in pkg["addons"]:
            lines.append(
                "      { name: %s, price: %s, description: %s, visibility: true }," % (
                    js_string(addon["name"]),
                    addon["price"],
                    js_string(addon["description"]),
                )
            )
        lines.append("    ],")

    lines.append("  },")
    return "\n".join(lines)


def render_module(packages: list[dict], group: dict) -> str:
    """Render full seed module file."""
    event_array = ", ".join(js_string(s) for s in group["event_slugs"])
    body = "\n".join(render_package_js(pkg) for pkg in packages)
    template = (
        "'use strict';\n\n"
        "const { seedDecorPackages } = require('./decor-proposal-shared');\n\n"
        "const EVENT_SLUG_CANDIDATES = [__EVENTS__];\n\n"
        "const __EXPORT__ = [\n__BODY__\n];\n\n"
        "async function __SEED_FN__(strapi) {\n"
        "  return seedDecorPackages(strapi, __EXPORT__, {\n"
        "    eventSlugCandidates: EVENT_SLUG_CANDIDATES,\n"
        "    logPrefix: '__LOG__',\n"
        "  });\n"
        "}\n\n"
        "module.exports = {\n"
        "  __EXPORT__,\n"
        "  EVENT_SLUG_CANDIDATES,\n"
        "  __SEED_FN__,\n"
        "};\n"
    )
    return (
        template.replace("__EVENTS__", event_array)
        .replace("__BODY__", body)
        .replace("__EXPORT__", group["export_name"])
        .replace("__SEED_FN__", group["seed_fn"])
        .replace("__LOG__", group["log_prefix"])
    )


def main() -> None:
    """Generate decor seed modules from JSON summary."""
    summary = json.loads(SUMMARY_PATH.read_text(encoding = "utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_slugs: set[str] = set()

    for workbook in summary.get("workbooks") or []:
        file_name = workbook.get("file") or ""
        if "Catering" in file_name:
            continue
        group = WORKBOOK_GROUPS.get(file_name)
        if not group:
            continue

        packages: list[dict] = []
        for pkg in workbook.get("packages") or []:
            sheet_key = str(pkg.get("sheet_name") or "").strip().lower()
            if pkg.get("sheet_name", "").strip() in SKIP_SHEETS:
                continue
            seed = package_to_seed(pkg, sheet_key, file_name)
            if not seed:
                continue
            if seed["slug"] in all_slugs:
                raise SystemExit("Duplicate slug across workbooks: %s" % seed["slug"])
            all_slugs.add(seed["slug"])
            packages.append(seed)

        out_path = ROOT / "strapi" / "src" / "seed" / group["module"]
        out_path.write_text(render_module(packages, group), encoding = "utf-8")
        print("%s -> %d packages" % (out_path.name, len(packages)))

    manifest = {
        "generated_from": str(SUMMARY_PATH.relative_to(ROOT)),
        "package_count": len(all_slugs),
        "slugs": sorted(all_slugs),
        "skipped_catering": "Final Catering Menu - use existing catering-* seeds (no duplicate packages)",
        "skipped_incomplete": ["IS 2", "IS 3", "CP"],
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent = 2), encoding = "utf-8")
    print("Total slugs:", len(all_slugs))


if __name__ == "__main__":
    main()
