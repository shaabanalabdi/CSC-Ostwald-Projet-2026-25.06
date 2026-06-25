// ============================================================
// admin-upload.js — uploads admin (images + vidéos).
// Protégée par auth. Multer parse le multipart/form-data et rejette les
// payloads trop volumineux ou de type non autorisé avant le contrôleur.
//   POST /api/admin/upload        champ "image" → image (≤ 5 Mo)
//   POST /api/admin/upload/video  champ "video" → vidéo (≤ 50 Mo)
// ============================================================

import { Router } from 'express';
import { UploadController } from '../../controller/UploadController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { uploadImage } from '../../middleware/uploadImage.js';
import { uploadVideo } from '../../middleware/uploadVideo.js';

const router = Router();
router.use(isAuthenticated);

// `image` / `video` sont les noms de champ que le client doit utiliser.
router.post('/', uploadImage.single('image'), UploadController.uploadOne);
router.post('/video', uploadVideo.single('video'), UploadController.uploadOne);

export default router;
