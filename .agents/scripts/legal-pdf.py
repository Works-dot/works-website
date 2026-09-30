from pathlib import Path
import fitz
import json

out = Path(".local/legal-review")
out.mkdir(parents=True, exist_ok=True)
for source in Path("artifacts/strapi/src/seed-documents").glob("*.pdf"):
    doc = fitz.open(source)
    text = []
    for index, page in enumerate(doc):
        text.append(page.get_text())
        page.get_pixmap(matrix=fitz.Matrix(1, 1)).save(str(out / f"{source.stem}-{index+1}.png"))
    (out / f"{source.stem}.txt").write_text("\n".join(text))
    (out / f"{source.stem}.pages.json").write_text(json.dumps(text, ensure_ascii=False))
    print(source.name, len(doc))