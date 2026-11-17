// Matrice d'un QR code (côté serveur), marge blanche comprise. Aucune image n'est stockée.
import QRCode from "npm:qrcode@1.5.4";

export function matriceQr(texte: string, marge = 2): boolean[][] {
  const q = QRCode.create(texte, { errorCorrectionLevel: "M" });
  const n = q.modules.size;
  const total = n + marge * 2;
  const m: boolean[][] = [];
  for (let y = 0; y < total; y++) {
    const r: boolean[] = [];
    for (let x = 0; x < total; x++) {
      const yy = y - marge, xx = x - marge;
      r.push(yy >= 0 && xx >= 0 && yy < n && xx < n ? !!q.modules.data[yy * n + xx] : false);
    }
    m.push(r);
  }
  return m;
}
