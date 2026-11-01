#!/usr/bin/env python3
"""Jednorazowo przypisuje daty publikacji (1.08–31.10.2026) wpisom bez daty.

Okres 92 dni dzielony jest na tyle równych przedziałów, ile wpisów ma
portal; w każdym przedziale losowany jest jeden dzień i godzina (stałe
ziarno). Daty są zapisywane na stałe we front matter plików, więc nie
zmieniają się przy kolejnych budowaniach.
"""
import random
import re
import sys
from datetime import date, timedelta
from pathlib import Path

START, DAYS = date(2026, 8, 1), 92


def assign(portal: Path):
    files = sorted((portal / "content").glob("*.md"))
    if all(re.search(r"^date: ", f.read_text(encoding="utf-8"), re.M) for f in files):
        print(f"{portal.name}: wszystkie wpisy mają już daty")
        return
    r = random.Random(f"daty-{portal.name}")
    n = len(files)
    days = []
    for i in range(n):
        lo, hi = int(i * DAYS / n), int((i + 1) * DAYS / n) - 1
        days.append(START + timedelta(days=r.randint(lo, max(lo, hi))))
    r.shuffle(files)
    for f, d in zip(files, days):
        text = f.read_text(encoding="utf-8")
        stamp = f"{d.isoformat()} {r.randint(6, 20):02d}:{r.choice(range(0, 60, 5)):02d}"
        text = re.sub(r"^date:.*\n", "", text, flags=re.M)
        text = text.replace("\ncategory:", f"\ndate: {stamp}\ncategory:", 1)
        f.write_text(text, encoding="utf-8")
    print(f"{portal.name}: przypisano {n} dat")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        assign(Path(p))
