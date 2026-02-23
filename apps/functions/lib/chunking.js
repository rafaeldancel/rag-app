export function chunkText(text, maxChars = 1200) {
    const paras = text
        .split(/\n{2,}/g)
        .map(p => p.trim())
        .filter(Boolean);
    const chunks = [];
    let buf = '';
    for (const p of paras) {
        if ((buf + '\n\n' + p).length > maxChars) {
            if (buf)
                chunks.push(buf);
            buf = p;
        }
        else {
            buf = buf ? `${buf}\n\n${p}` : p;
        }
    }
    if (buf)
        chunks.push(buf);
    return chunks;
}
