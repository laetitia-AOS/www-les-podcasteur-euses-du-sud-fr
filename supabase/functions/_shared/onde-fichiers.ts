// Type réel d'un fichier d'après ses premiers octets (le nom ou le type annoncé ne suffisent pas).
// Mêmes règles que la fonction « onde-fichier » : photos JPG, PNG, WebP ; son MP3.
export type TypeFichier = { sorte: "image" | "audio"; mime: string; ext: string };

export const detecterFichier = (b: Uint8Array): TypeFichier | null => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { sorte: "image", mime: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { sorte: "image", mime: "image/png", ext: "png" };
  }
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return { sorte: "image", mime: "image/webp", ext: "webp" };
  }
  // MP3 : étiquette ID3 en tête, ou directement une trame MPEG audio (couche III)
  if (b.length > 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return { sorte: "audio", mime: "audio/mpeg", ext: "mp3" };
  if (b.length > 4 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) === 0x02) return { sorte: "audio", mime: "audio/mpeg", ext: "mp3" };
  return null;
};
