/**
 * Lightweight in-browser PalmDOC / MOBI / AZW parser.
 * Reads PDB headers, decompresses PalmDOC LZ77 text records, and extracts HTML content.
 */

export interface ParsedMobi {
  title: string
  author?: string
  contentHtml: string
  chapters: { title: string; offset: number }[]
}

function decompressPalmDoc(data: Uint8Array): Uint8Array {
  const output: number[] = []
  let i = 0

  while (i < data.length) {
    const byte = data[i++]

    if (byte === 0x00) {
      output.push(0x00)
    } else if (byte >= 0x01 && byte <= 0x08) {
      // Literal next `byte` count of bytes
      for (let j = 0; j < byte && i < data.length; j++) {
        output.push(data[i++])
      }
    } else if (byte <= 0x7f) {
      // Literal single ASCII
      output.push(byte)
    } else if (byte >= 0x80 && byte <= 0xbf) {
      // 2-byte sequence: distance and length
      if (i >= data.length) break
      const byte2 = data[i++]
      const distance = ((byte & 0x3f) << 3) | (byte2 >> 5)
      const length = (byte2 & 0x1f) + 3

      for (let j = 0; j < length; j++) {
        const copyIndex = output.length - distance
        if (copyIndex >= 0 && copyIndex < output.length) {
          output.push(output[copyIndex])
        } else {
          output.push(0x20) // fallback space
        }
      }
    } else {
      // 0xc0 to 0xff: space + char
      output.push(0x20)
      output.push(byte ^ 0x80)
    }
  }

  return new Uint8Array(output)
}

export function parseMobiBuffer(buffer: ArrayBuffer, fallbackTitle = 'MOBI Book'): ParsedMobi {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // 1. Read PDB Header (Database name at 0-31)
  let pdbName = ''
  for (let i = 0; i < 32; i++) {
    const charCode = bytes[i]
    if (charCode === 0) break
    pdbName += String.fromCharCode(charCode)
  }

  // Number of records at offset 76 (2 bytes, big-endian)
  const numRecords = view.getUint16(76, false)

  // Record offsets table starts at 78
  const recordOffsets: number[] = []
  for (let r = 0; r < numRecords; r++) {
    const offset = view.getUint32(78 + r * 8, false)
    recordOffsets.push(offset)
  }

  if (recordOffsets.length === 0) {
    throw new Error('Định dạng MOBI không hợp lệ: Không tìm thấy records.')
  }

  // Record 0 contains MOBI / PalmDOC header
  const rec0Offset = recordOffsets[0]
  const compressionType = view.getUint16(rec0Offset, false)
  const textRecordCount = view.getUint16(rec0Offset + 8, false)

  // Extract Full Title from MOBI header if present
  let bookTitle = pdbName || fallbackTitle
  try {
    const mobiMagic = String.fromCharCode(
      bytes[rec0Offset + 16],
      bytes[rec0Offset + 17],
      bytes[rec0Offset + 18],
      bytes[rec0Offset + 19]
    )
    if (mobiMagic === 'MOBI') {
      const fullNameOffset = view.getUint32(rec0Offset + 84, false)
      const fullNameLength = view.getUint32(rec0Offset + 88, false)
      if (fullNameLength > 0 && fullNameLength < 500) {
        const titleBytes = bytes.slice(
          rec0Offset + fullNameOffset,
          rec0Offset + fullNameOffset + fullNameLength
        )
        const decoded = new TextDecoder('utf-8').decode(titleBytes).trim()
        if (decoded) bookTitle = decoded
      }
    }
  } catch {
    // ignore
  }

  // Decompress and assemble text records
  const textChunks: Uint8Array[] = []
  const maxRecordsToRead = Math.min(textRecordCount, recordOffsets.length - 1)

  for (let i = 1; i <= maxRecordsToRead; i++) {
    const start = recordOffsets[i]
    const end = i < recordOffsets.length - 1 ? recordOffsets[i + 1] : buffer.byteLength
    const slice = bytes.slice(start, end)

    if (compressionType === 2) {
      // PalmDOC LZ77 compressed
      textChunks.push(decompressPalmDoc(slice))
    } else if (compressionType === 1) {
      // Uncompressed
      textChunks.push(slice)
    } else {
      // Other compression, try raw slice
      textChunks.push(slice)
    }
  }

  // Combine and decode HTML
  const totalLength = textChunks.reduce((acc, c) => acc + c.length, 0)
  const combined = new Uint8Array(totalLength)
  let curOffset = 0
  for (const chunk of textChunks) {
    combined.set(chunk, curOffset)
    curOffset += chunk.length
  }

  let htmlContent = new TextDecoder('utf-8', { fatal: false }).decode(combined)

  // Basic cleanup and chapter detection
  const chapters: { title: string; offset: number }[] = []
  const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const cleanTitle = match[1].replace(/<[^>]+>/g, '').trim()
    if (cleanTitle) {
      chapters.push({ title: cleanTitle, offset: match.index })
    }
  }

  // If no HTML tags found, wrap plain text in paragraphs
  if (!htmlContent.includes('<p>') && !htmlContent.includes('<div>')) {
    htmlContent = htmlContent
      .split(/\n{2,}/)
      .map((p) => `<p class="mb-4">${p.trim()}</p>`)
      .join('\n')
  }

  return {
    title: bookTitle,
    contentHtml: htmlContent,
    chapters: chapters.length > 0 ? chapters : [{ title: 'Bắt đầu', offset: 0 }],
  }
}
