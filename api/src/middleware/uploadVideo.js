// ============================================================
// uploadVideo.js — Middleware Multer pour les uploads de vidéos admin.
//
// Séparé de uploadImage.js À DESSEIN : les vidéos ont un plafond de
// taille bien plus élevé (50 Mo vs 5 Mo) et une liste blanche MIME
// différente. Garder deux middlewares évite qu'élargir le plafond
// vidéo n'affecte aussi les uploads d'images (logos, photos d'équipe…).
//
// Stockage : même dossier api/uploads/ que les images, re-servi via
// `express.static('/uploads')`. Nom de fichier = "<hash>.<ext>".
//
// Sécurité :
//   - Plafond de 50 Mo — suffisant pour une courte vidéo de fond Hero
//     compressée, sans ouvrir la porte à des uploads abusifs.
//   - Liste blanche MIME (video/mp4, video/webm). Contrairement au SVG,
//     un conteneur .mp4/.webm ne peut pas embarquer de script exécuté
//     par le navigateur quand il est servi same-origin.
//   - Extension dérivée du type MIME VALIDÉ, jamais de `originalname`
//     (même protection anti-XSS-stocké que uploadImage.js).
//
// Note de production : sur le free tier de Render le système de
// fichiers est ÉPHÉMÈRE — une vidéo de 40 Mo disparaît au prochain
// redéploi. Pour un stockage pérenne, viser un hébergement à disque
// persistant (VPS OVH) ou une cible S3/CDN.
// ============================================================

import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

// S'assure que le dossier existe au démarrage — multer ne le crée pas.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// La MAP pilote aussi l'extension du fichier sauvegardé — voir
// `storage.filename`. Ne JAMAIS dériver l'extension de
// `file.originalname` (vecteur de path-traversal / XSS stocké).
const MIME_TO_EXT = new Map([
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
]);
const ALLOWED_MIME = new Set(MIME_TO_EXT.keys());

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // SHA-256 tronqué à 32 caractères hex — adressage par contenu, pas
    // par nom fourni par l'utilisateur.
    const hash = createHash('sha256')
      .update(`${file.originalname}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .slice(0, 32);
    const ext = MIME_TO_EXT.get(file.mimetype) ?? '.bin';
    cb(null, `${hash}${ext}`);
  },
});

export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 Mo
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        Object.assign(new Error('Type de fichier non supporté'), {
          status: 415,
        }),
      );
      return;
    }
    cb(null, true);
  },
});
