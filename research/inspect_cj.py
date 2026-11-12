#!/usr/bin/env python3
"""Reproduce CJ's static data inventory without executing or modifying CJ."""

import hashlib
import json
import re
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "legacy" / "CJ"
OUTPUT = Path(__file__).resolve().parent / "extracted"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    originals = {p.name: p.read_bytes() for p in SOURCE.iterdir() if p.is_file()}
    inventory = [
        {"name": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        for name, data in sorted(originals.items())
    ]
    lessons = []
    lesson_names = sorted(
        (name for name in originals if re.fullmatch(r"TEST\d+\.ATC", name)),
        key=lambda name: int(re.search(r"\d+", name).group()),
    )
    for name in lesson_names:
        raw = originals[name]
        # Preserve whitespace and line breaks. Remove only a final DOS EOF byte.
        body = raw[:-1] if raw.endswith(b"\x1a") else raw
        text = body.decode("big5", errors="strict")
        lessons.append({"source": name, "text": text, "encoding": "big5"})

    sets = []
    for name, width in [("DICTION", None), ("PREFIX", 2), ("POSTFIX", 3)]:
        data = originals[name + ".PLB"]
        count = struct.unpack_from("<H", data)[0]
        offsets = struct.unpack_from("<" + "H" * count, data, 2)
        if len(data) != 2 + count * 34:
            raise ValueError(f"{name}: unexpected record sizes")
        if list(offsets) != [2 + 2 * count + 32 * i for i in range(count)]:
            raise ValueError(f"{name}: unexpected offsets")
        answers = originals[name + ".ANS"].decode("ascii")
        if width is None:
            codes = answers.split()
        else:
            if len(answers) % width:
                raise ValueError(f"{name}: incomplete answer field")
            codes = [answers[i:i + width] for i in range(0, len(answers), width)]
        if len(codes) != count:
            raise ValueError(f"{name}: answer/glyph count mismatch")
        records = []
        for i, offset in enumerate(offsets):
            raw = data[offset:offset + 32]
            if raw[:4] != b"\x0f\x00\x0e\x00":
                raise ValueError(f"{name}: unexpected glyph header")
            records.append({
                "index": i + 1,
                "answer_raw": codes[i],
                "answer_trimmed_candidate": codes[i].strip(),
                "source_offset": offset,
                "record_hex": raw.hex(),
                "bitmap_rows_u16_be_candidate": list(struct.unpack(">14H", raw[4:])),
            })
        sets.append({
            "source": name, "count": count, "records": records,
            "status": "Record boundaries and answer counts verified; display and answer semantics need runtime confirmation.",
        })

    # The GP header contains readable resource names. This is an inventory only;
    # it does not assume its unknown metadata fields are lengths or offsets.
    gp = originals["TSANGJEI.GP"]
    # Observed 20-byte directory records: container name, then 12 resources.
    resource_names = [
        gp[offset:offset + 20].split(b"\x00", 1)[0].decode("ascii")
        for offset in range(2, 262, 20)
    ]
    summary = {
        "source": "legacy/CJ",
        "file_count": len(inventory),
        "total_bytes": sum(row["bytes"] for row in inventory),
        "lessons": len(lessons),
        "lesson_codepoints_including_whitespace": sum(len(row["text"]) for row in lessons),
        "training_records": sum(row["count"] for row in sets),
        "gp_resource_names_observed": resource_names,
        "limitations": [
            "No executable was run or unpacked; no REA/Ghidra invocation was performed.",
            "No full character-to-Cangjie mapping or scoring algorithm was recovered.",
            "Fixed-width answer padding and glyph rendering need runtime confirmation.",
        ],
    }
    for filename, value in [
        ("inventory.json", inventory), ("lessons.json", lessons),
        ("training-records.json", sets), ("summary.json", summary),
    ]:
        (OUTPUT / filename).write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    for name, original in originals.items():
        if (SOURCE / name).read_bytes() != original:
            raise RuntimeError(f"Source changed during inspection: {name}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
