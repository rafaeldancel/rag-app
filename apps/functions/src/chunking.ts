export function chunkText(text: string, maxChars = 1200): string[] {
  const paras = text
    .split(/\n{2,}/g)
    .map(p => p.trim())
    .filter(Boolean)
  const chunks: string[] = []
  let buf = ''
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > maxChars) {
      if (buf) chunks.push(buf.trim())
      if (p.length <= maxChars) {
        buf = p
      } else {
        // Paragraph alone exceeds maxChars — split at sentence boundaries
        buf = ''
        const sentences = p.match(/[^.!?]+[.!?]+\s*/g) ?? [p]
        for (const sentence of sentences) {
          if ((buf + sentence).length > maxChars) {
            if (buf) chunks.push(buf.trim())
            buf = sentence
          } else {
            buf += sentence
          }
        }
      }
    } else {
      buf = buf ? `${buf}\n\n${p}` : p
    }
  }
  if (buf) chunks.push(buf.trim())
  return chunks
}
