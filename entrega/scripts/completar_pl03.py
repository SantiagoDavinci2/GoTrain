"""Completa la planilla PL03_ENTREGA.docx con los datos y enlaces de la entrega.

Uso:  python completar_pl03.py <URL del repositorio GitHub> [URL web] [URL APK]
Si no se pasan URL de web/APK, se usan los enlaces del repositorio; con "-" quedan "(pendiente)".
"""
import sys
from pathlib import Path

import docx
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor

ORIGEN = Path(r"C:\Users\ghian\Downloads\PL03_ENTREGA.docx")
DESTINO = Path(__file__).resolve().parents[1] / "PL03_ENTREGA_GoTrain.docx"

repo = (sys.argv[1] if len(sys.argv) > 1 else "").rstrip("/")
blob = f"{repo}/blob/main/entrega"
url_web = sys.argv[2] if len(sys.argv) > 2 else f"{repo}#cómo-correrlo"
url_apk = sys.argv[3] if len(sys.argv) > 3 else f"{repo}/releases/latest"

DOCS = {
    "Fecha de entrega:": None,
    "Manual de usuario APK": "documentos/GoTrain_Manual_de_Usuario_APK.docx",
    "Manual de usuario Web": "documentos/GoTrain_Manual_de_Usuario_Web.docx",
    "Casos de uso": "documentos/GoTrain_Casos_de_Uso.docx",
    "Casos de prueba": "documentos/GoTrain_Casos_de_Prueba.docx",
    "UML": "documentos/GoTrain_UML.docx",
    "Requisitos funcionales": "documentos/GoTrain_Requisitos_Funcionales.docx",
    "Requisitos no funcionales": "documentos/GoTrain_Requisitos_No_Funcionales.docx",
    "DER": "documentos/GoTrain_DER.docx",
    "Diseño de arquitectura": "documentos/GoTrain_Diseno_de_Arquitectura.docx",
    "Diagrama de componentes": "documentos/GoTrain_Diagrama_de_Componentes.docx",
    "Gantt": "documentos/GoTrain_Gantt.docx",
    "Video Demo APK": "videos/GoTrain_Demo_App.mp4",
    "Video Demo Web": "videos/GoTrain_Demo_Web.mp4",
}

USUARIOS = [
    ("santiago@gotrain.com", "gotrain123", "Usuario demo principal: 21 días de racha, historial, retos y logros cargados."),
    ("maria@gotrain.com", "gotrain123", "Usuaria de la comunidad: completó el reto \"100km del mes\"."),
    ("jose@gotrain.com", "gotrain123", "Rival del \"Duelo 1v1\" de santiago."),
    ("tomas@gotrain.com", "gotrain123", "Participante del reto \"100km del mes\"."),
    ("ana@gotrain.com", "gotrain123", "Participante de retos grupales."),
    ("(registro libre)", "—", "Se puede crear una cuenta nueva desde \"Registrate gratis\" en la web o la app."),
]


def escribir(celda, texto, url=None):
    p = celda.paragraphs[0]
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    if not url:
        run = p.add_run(texto)
        run.font.size = Pt(10)
        return
    r_id = p.part.relate_to(url, RT.HYPERLINK, is_external=True)
    h = OxmlElement("w:hyperlink")
    h.set(qn("r:id"), r_id)
    r = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    for tag, val in (("w:color", "0563C1"), ("w:u", "single"), ("w:sz", "20")):
        e = OxmlElement(tag)
        e.set(qn("w:val"), val)
        rpr.append(e)
    r.append(rpr)
    t = OxmlElement("w:t")
    t.text = texto
    t.set(qn("xml:space"), "preserve")
    r.append(t)
    h.append(r)
    p._p.append(h)


d = docx.Document(ORIGEN)
t0, t1, t2, t3 = d.tables
escribir(t0.rows[0].cells[1], "GoTrain — Aplicación social de fitness con Coach IA")
escribir(t0.rows[1].cells[1], "Santiago Ghiano")

for fila in t1.rows:
    clave = fila.cells[0].text.strip()
    if clave == "Fecha de entrega:":
        escribir(fila.cells[1], sys.argv[4] if len(sys.argv) > 4 else "11/11/2026")
    elif clave in DOCS and DOCS[clave]:
        nombre = DOCS[clave].split("/")[-1]
        escribir(fila.cells[1], nombre, f"{blob}/{DOCS[clave]}" if repo else None)

for fila, url in ((t2.rows[0], url_apk), (t2.rows[1], url_web)):
    ok = repo and url != "-"  # "-" deja el campo como pendiente
    escribir(fila.cells[1], url if ok else "(pendiente)", url if ok else None)
escribir(t2.rows[2].cells[1], repo or "(pendiente)", repo or None)

for fila, (u, c, info) in zip(t3.rows[1:], USUARIOS):
    escribir(fila.cells[0], u)
    escribir(fila.cells[1], c)
    escribir(fila.cells[2], info)

d.save(DESTINO)
print("ok", DESTINO)
