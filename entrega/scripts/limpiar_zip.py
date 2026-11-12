"""Quita las entradas de carpeta de los .docx (algunos servicios en la nube no los abren si las tienen)."""
import sys
import zipfile
from pathlib import Path

for f in Path(sys.argv[1]).glob("*.docx"):
    with zipfile.ZipFile(f) as z:
        items = [(i, z.read(i)) for i in z.infolist() if not i.filename.endswith("/")]
    with zipfile.ZipFile(f, "w", zipfile.ZIP_DEFLATED) as z:
        for info, data in items:
            z.writestr(info, data)
print("ok")
