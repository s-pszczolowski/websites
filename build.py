#!/usr/bin/env python3
"""Buduje wszystkie portale (lub wybrane): python3 build.py [katalog ...]

Wynik każdego portalu trafia do <katalog>/public/ – to gotowy do wgrania
na dowolny hosting statyczny zestaw plików.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "tools"))
import sitegen  # noqa: E402

PORTALS = ["szczecinnacodzien.pl", "pulsprofilaktyki.pl", "nastrojmagazyn.pl", "rodzinnykompas.com.pl", "wiemiwybieram.pl"]

if __name__ == "__main__":
    for name in sys.argv[1:] or PORTALS:
        site = sitegen.build(ROOT / name)
        print(f"{site.name:28s} {len(site.articles):3d} artykułów -> {site.out.relative_to(ROOT)}")
