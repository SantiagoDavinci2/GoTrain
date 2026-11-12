// Mini-librería para armar los documentos de la entrega con un formato común
const fs = require('fs')
const path = require('path')
const sizeOf = require('image-size')
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, PageBreak, Header, Footer, PageNumber, LevelFormat, BorderStyle, TableOfContents,
} = require('docx')

const ROJO = 'E94560'
const OSCURO = '1A1A2E'
const ANCHO = 9638 // A4 con márgenes de 2 cm (DXA)
const ENTREGA = path.resolve(__dirname, '..')
const META = { alumno: 'Santiago Ghiano', version: '2.0', fecha: '11/11/2026' }

const t = (text, o = {}) => new TextRun({ text, font: 'Calibri', ...o })

function rich(s, base = {}) {
  // **negrita** dentro del texto
  return s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((x) =>
    x.startsWith('**') ? t(x.slice(2, -2), { ...base, bold: true }) : t(x, base))
}

const P = (s, o = {}) => new Paragraph({ children: rich(s), spacing: { after: 120, line: 276 }, ...o })
const H1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)] })
const H2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)] })
const H3 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [t(s)] })
const BR = () => new Paragraph({ children: [new PageBreak()] })
const bullets = (items, ref = 'vinetas') => items.map((s) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: rich(s), spacing: { after: 60 } }))
const pasos = (items) => {
  const ref = `pasos${pasos.n = (pasos.n || 0) + 1}`
  pasos.refs.push(ref)
  return items.map((s) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: rich(s), spacing: { after: 60 } }))
}
pasos.refs = []

function img(rel, maxPx = 600, caption) {
  const file = path.join(ENTREGA, rel)
  const d = sizeOf(file)
  const w = Math.min(maxPx, d.width)
  const h = Math.round((d.height * w) / d.width)
  const out = [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: caption ? 40 : 160 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: w, height: h } })],
  })]
  if (caption) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [t(caption, { italics: true, size: 18, color: '666666' })] }))
  return out
}

// Dos capturas de celular lado a lado
function imgPar(a, b, capA, capB, ancho = 230) {
  const celda = (rel, cap) => new TableCell({
    width: { size: ANCHO / 2, type: WidthType.DXA }, borders: SIN_BORDE,
    children: [...img(rel, ancho, cap)],
  })
  return new Table({ width: { size: ANCHO, type: WidthType.DXA }, columnWidths: [ANCHO / 2, ANCHO / 2],
    borders: SIN_BORDE, rows: [new TableRow({ children: [celda(a, capA), celda(b, capB)] })] })
}

const SIN = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const SIN_BORDE = { top: SIN, bottom: SIN, left: SIN, right: SIN, insideHorizontal: SIN, insideVertical: SIN }
const BORDE = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFC8' }

function tabla(headers, rows, pesos) {
  const tot = pesos ? pesos.reduce((a, b) => a + b, 0) : headers.length
  const widths = (pesos || headers.map(() => 1)).map((p) => Math.floor((ANCHO * p) / tot))
  widths[widths.length - 1] += ANCHO - widths.reduce((a, b) => a + b, 0)
  const celda = (txt, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: OSCURO, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
    children: String(txt).split('\n').map((linea) => new Paragraph({ spacing: { after: 20 },
      children: head ? [t(linea, { bold: true, color: 'FFFFFF', size: 19 })] : rich(linea, { size: 19 }) })),
  })
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => celda(h, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => {
        const cell = celda(c, i, false)
        if (ri % 2 === 1) cell.options = cell.options
        return cell
      }) }))],
  })
}

// Tabla de 2 columnas campo / valor (fichas de casos de uso, diccionario, etc.)
function ficha(pares) {
  const w = [Math.round(ANCHO * 0.26), ANCHO - Math.round(ANCHO * 0.26)]
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: w,
    rows: pares.map(([k, v]) => new TableRow({ children: [
      new TableCell({ width: { size: w[0], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'FDE8EC', color: 'auto' },
        margins: { top: 60, bottom: 60, left: 90, right: 90 }, borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
        children: [new Paragraph({ children: [t(k, { bold: true, size: 19, color: OSCURO })] })] }),
      new TableCell({ width: { size: w[1], type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 90, right: 90 },
        borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
        children: (Array.isArray(v) ? v : String(v).split('\n')).map((l) => new Paragraph({ spacing: { after: 30 }, children: rich(l, { size: 19 }) })) }),
    ] })),
  })
}
const espacio = () => new Paragraph({ spacing: { after: 120 }, children: [] })

function portada(titulo, sub) {
  const linea = (s, o) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [t(s, o)] })
  return [
    new Paragraph({ spacing: { before: 1400 }, children: [] }),
    linea('Escuela Da Vinci', { size: 28, color: '555555' }),
    linea('Carrera Analista de Sistemas · Seminario Final', { size: 24, color: '555555' }),
    new Paragraph({ spacing: { before: 900, after: 200 }, alignment: AlignmentType.CENTER, children: [t('GoTrain', { size: 88, bold: true, color: ROJO })] }),
    linea('Aplicación social de fitness con Coach IA', { size: 26, color: OSCURO }),
    new Paragraph({ spacing: { before: 700, after: 120 }, alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 12, color: ROJO, space: 12 } }, children: [t(titulo, { size: 44, bold: true, color: OSCURO })] }),
    ...(sub ? [linea(sub, { size: 24, color: '666666', italics: true })] : []),
    new Paragraph({ spacing: { before: 1500 }, children: [] }),
    linea(`Alumno: ${META.alumno}`, { size: 24 }),
    linea(`Versión ${META.version} · ${META.fecha}`, { size: 22, color: '666666' }),
    BR(),
  ]
}

function control(desc) {
  return [H1('Control de versiones'), tabla(['Versión', 'Fecha', 'Autor', 'Descripción'], [
    ['1.0', '24/09/2026', META.alumno, 'Versión inicial (Parcial 1, sobre prototipos).'],
    [META.version, META.fecha, META.alumno, desc],
  ], [1, 1.3, 1.8, 4.5]), espacio()]
}

async function generar(nombre, titulo, sub, cuerpo, { indice = true, descVersion } = {}) {
  const doc = new Document({
    creator: META.alumno, title: `GoTrain — ${titulo}`,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Calibri', size: 32, bold: true, color: ROJO }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Calibri', size: 26, bold: true, color: OSCURO }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Calibri', size: 23, bold: true, color: '444466' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      ...pasos.refs.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
    ] },
    features: { updateFields: indice },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ROJO, space: 4 } },
        children: [t(`GoTrain · ${titulo}`, { size: 16, color: '888888' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [t('Página ', { size: 16, color: '888888' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Calibri' })] })] }) },
      children: [
        ...portada(titulo, sub),
        ...control(descVersion || 'Actualización según la implementación final (Parcial 2).'),
        ...(indice ? [H1('Índice'), new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }), BR()] : []),
        ...cuerpo.flat(Infinity),
      ],
    }],
  })
  const out = path.join(ENTREGA, 'documentos', `${nombre}.docx`)
  fs.writeFileSync(out, await Packer.toBuffer(doc))
  console.log('ok', nombre)
}

module.exports = { P, H1, H2, H3, BR, bullets, pasos, img, imgPar, tabla, ficha, espacio, generar, t, META }
