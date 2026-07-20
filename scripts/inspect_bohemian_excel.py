#!/usr/bin/env python3
"""Inspect Birthday Package- Bohemian .xlsx sheet structure."""

from __future__ import annotations

import re
from pathlib import Path

from openpyxl import load_workbook

XLSX = Path(__file__).resolve().parents[1] / "Birthday Package- Bohemian .xlsx"


def norm(value: object) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\r\n", "\n").replace("\r", "\n")).strip()


def amt(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    text = norm(value).replace(",", "").replace("₹", "").replace("Rs.", "").replace("Rs", "")
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group(0)) if match else None


def main() -> None:
    workbook = load_workbook(XLSX, data_only = True)
    print("sheets:", workbook.sheetnames)

    for name in workbook.sheetnames:
        ws = workbook[name]
        pkg = norm(ws.cell(1, 1).value)
        title = norm(ws.cell(1, 2).value) or norm(ws.cell(1, 1).value)
        package_price = platform = labour = total = None
        includes: list[str] = []
        in_includes = False

        for row in range(1, (ws.max_row or 1) + 1):
            a = norm(ws.cell(row, 1).value)
            al = a.lower().rstrip(":")
            if al == "package price":
                for col in range(2, 8):
                    value = amt(ws.cell(row, col).value)
                    if value is not None:
                        package_price = value
                        break
            elif "transport" in al and "labour" in al:
                for col in range(2, 8):
                    value = amt(ws.cell(row, col).value)
                    if value is not None:
                        labour = value
                        break
            elif al == "platform fee":
                for col in range(2, 8):
                    value = amt(ws.cell(row, col).value)
                    if value is not None:
                        platform = value
                        break
            elif al.startswith("total price"):
                for col in range(2, 8):
                    value = amt(ws.cell(row, col).value)
                    if value is not None:
                        total = value
                        break
            if "what's included" in al or "whats included" in al:
                in_includes = True
                continue
            if in_includes:
                if (
                    al.startswith("nitty")
                    or al.startswith("the price")
                    or al.startswith("best")
                    or al.startswith("why")
                    or al.startswith("setup")
                    or al.startswith("policies")
                ):
                    in_includes = False
                elif a.startswith("- ") or a:
                    if a.startswith("- "):
                        includes.append(a[2:][:100])
                    elif a and not al.startswith("description"):
                        # keep bullet-like rows only
                        if len(a) < 180:
                            includes.append(a[:100])

        print(
            "%s | %s | title=%s | pp=%s plat=%s lab=%s total=%s | includes=%s"
            % (name, pkg, title[:40], package_price, platform, labour, total, len(includes))
        )
        for item in includes[:8]:
            print("   -", item)


if __name__ == "__main__":
    main()
