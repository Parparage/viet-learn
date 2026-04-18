import * as XLSX from 'xlsx'

export async function parseXlsm(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const words = []
  for (let i = 1; i < rows.length; i++) {
    const [theme, viet, fr] = rows[i]
    const v = String(viet || '').trim()
    const f = String(fr || '').trim()
    if (v) {
      words.push({ id: i, theme: String(theme || '').trim(), viet: v, fr: f })
    }
  }
  return words
}
