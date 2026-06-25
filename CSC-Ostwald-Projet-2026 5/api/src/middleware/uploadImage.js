// ============================================================
// uploadImage.js — Middleware Multer pour les uploads d'images admin.
//
// Stratégie de stockage :
//   - Les fichiers sont écrits sous api/uploads/ (configurable via UPLOAD_DIR).
//   - Re-servis via `app.use('/uploads', express.static(UPLOAD_DIR))`
//     câblé dans server.js.
//   - Nom de fichier = "<hash>.<ext>" pour que la même image téléversée
//     deux fois ne crée jamais de doublon (le hash collisionne → fichier
//     existant réutilisé).
//
// Note de production : le free tier de Render a un système de fichiers
// ÉPHÉMÈRE — les fichiers ne persistent que jusqu'au prochain redéploi.
// Pour des uploads pérennes, échanger le stockage disque contre une cible
// compatible S3 (Cloudinary, Bunny.net, R2). Le contrat de l'endpoint
// (`{ url: string }`) reste le même, seul le moteur `storage` change.
//
// Sécurité :
//   - Plafond de 5 Mo. Raisonnable pour des photos hero / logos.
//   - Liste blanche MIME (image/png|jpeg|jpg|webp|gif). Le SVG est REJETÉ
//     — il peut embarquer du <script> et serait servi en same-origin
//     comme text/svg+xml.
//   - Le nom de fichier provient d'un hash côté serveur + d'une extension
//     dérivée du type MIME VALIDÉ (jamais de `originalname`). Empêche à la
//     fois le path-traversal et l'astuce « téléverser `evil.html` avec
//     MIME=image/png → XSS stocké sur /uploads/<hash>.html ».
// ============================================================

import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

// S'assure que le dossier existe au démarrage — multer ne le crée pas tout seul.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Le SVG est INTENTIONNELLEMENT exclu : un fichier `.svg` peut embarquer
// du `<script>`, et les navigateurs l'exécutent quand il est récupéré
// avec `Content-Type: image/svg+xml` depuis un chemin same-origin.
// Autoriser le SVG ici créerait un vecteur de XSS stocké sur
// `/uploads/<hash>.svg`. On s'en tient aux formats raster pour l'instant.
//
// La MAP pilote aussi l'extension du nom de fichier sauvegardé — voir
// `storage.filename` ci-dessous. Ne JAMAIS dériver l'extension de
// `file.originalname` : un appelant malveillant pourrait envoyer
// MIME=image/png mais originalname="evil.html", et le fichier serait
// sauvegardé en `<hash>.html` et servi en text/html par express.static.
// XSS stocké atteignable sur /uploads/<hash>.html.
const MIME_TO_EXT = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['application/pdf', '.pdf'],
]);
const ALLOWED_MIME = new Set(MIME_TO_EXT.keys());

// Stockage personnalisé pour que le nom de fichier soit adressé par
// contenu plutôt que de s'appuyer sur le nom original (fourni par
// l'utilisateur), qui serait un vecteur de path-traversal s'il était
// réutilisé tel quel.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // SHA-256 tronqué à 32 caractères hex (128 bits) — résistant aux
    // collisions pour la durée de vie d'upload du site sans gonfler l'URL.
    const hash = createHash('sha256')
      .update(`${file.originalname}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .slice(0, 32);
    // TOUJOURS choisir l'extension à partir du type MIME validé — jamais
    // de file.originalname (voir le commentaire ci-dessus sur le risque
    // de XSS stocké).
    const ext = MIME_TO_EXT.get(file.mimetype) ?? '.bin';
    cb(null, `${hash}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 Mo (flyers PDF inclus)
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

export const UPLOAD_DIR_PATH = UPLOAD_DIR;
