// ============================================================
// UploadController.js — Upload de fichiers réservé aux admins.
//
// Deux endpoints, un même contrôleur (la réponse ne dépend que de
// `req.file`, que le fichier soit une image ou une vidéo) :
//   POST /api/admin/upload        image (≤ 5 Mo)  — middleware uploadImage
//   POST /api/admin/upload/video  vidéo (≤ 50 Mo) — middleware uploadVideo
//
// Multer remplit `req.file` après l'exécution du middleware. On renvoie
// une URL relative à la racine de l'API afin que le formulaire admin
// puisse la stocker telle quelle dans le champ correspondant de l'entité
// (image_url / photo_url / logo_url / media_url…).
// ============================================================

import { BadRequestException } from '../error/HttpException.js';

export class UploadController {
  /**
   * Réponse d'upload commune aux routes image et vidéo.
   * 201 → { url: "/uploads/<hash>.<ext>" }
   * 400 → aucun fichier fourni
   * 415 → type mime non supporté (géré dans le middleware via fileFilter)
   */
  static uploadOne = async (req, res) => {
    if (!req.file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    // Chemin relatif — l'API sert /uploads/* via express.static donc
    // cette URL fonctionne depuis n'importe quel appelant, y compris le
    // frontend de même origine.
    return res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mime: req.file.mimetype,
    });
  };
}
