// ============================================================
// AuthService.js — Authentification admin (connexion, token, hash).
//
// JWT dans un cookie HTTPOnly (CLAUDE.md). Trois choses à retenir :
//   1. `findByEmail` AVANT `bcrypt.compare` (appeler compare avec un hash
//      undefined lève « data and hash arguments required » — le bug
//      Pokédex). Le message d'erreur est générique (« Identifiants
//      invalides ») pour que les attaquants ne puissent pas énumérer les
//      comptes valides.
//   2. Le secret JWT est chargé depuis l'env (config/env.js échoue
//      immédiatement en prod s'il vaut encore la valeur de dev par défaut).
//   3. Le hash du mot de passe n'est JAMAIS renvoyé — User.toJSON() le
//      retire, et la couche contrôleur s'appuie là-dessus.
// ============================================================

// `bcryptjs` (pur JS) au lieu de `bcrypt` (natif) — bcrypt 5.x tire
// l'abandonné @mapbox/node-pre-gyp qui dépend d'une version de `tar`
// avec plusieurs CVEs de gravité élevée (path traversal à l'extraction).
// bcryptjs est compatible API pour `hash` / `compare`, ~30 % plus lent au
// même facteur de coût — sans importance pour une connexion réservée aux
// admins à ~5 connexions/jour, et l'échange élimine toute la chaîne de
// compilation native + node-pre-gyp.
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/UserRepository.js';
import { emailService } from './EmailService.js';
import { Validator } from '../utils/Validator.js';
import { JWT_SECRET, JWT_TTL_SECONDS, RESET_TOKEN_TTL_MINUTES, APP_URL } from '../config/env.js';
import { BadRequestException, UnauthorizedException } from '../error/HttpException.js';

/** Facteur de coût bcrypt — 12 ≈ 250 ms sur du matériel moderne. */
const BCRYPT_ROUNDS = 12;

class AuthService {
  /**
   * Vérifie les identifiants et émet un JWT.
   *
   * @param {object} payload - { email, password }
   * @returns {Promise<{ user: User, token: string }>}
   *   L'appelant (le contrôleur) pose le cookie avec le token.
   * @throws {BadRequestException}  forme du payload invalide
   * @throws {UnauthorizedException} e-mail inconnu OU mot de passe incorrect
   *   (les deux renvoient le MÊME message — ne jamais divulguer lequel a échoué)
   */
  signIn = async (payload) => {
    const email = String(payload?.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(payload?.password ?? '');

    if (!Validator.isEmail(email) || password.length === 0) {
      throw new BadRequestException('Identifiants invalides');
    }

    // L'ordre compte : rechercher l'utilisateur D'ABORD pour que
    // bcrypt.compare reçoive toujours un vrai hash à comparer. Comparer
    // contre undefined lève une erreur node cryptique qui divulguerait
    // quel argument était mauvais.
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_TTL_SECONDS,
    });

    return { user, token };
  };

  /**
   * Vérifie un JWT et renvoie le payload décodé.
   * @returns {{ sub: number, email: string, role: string, iat: number, exp: number }}
   * @throws {UnauthorizedException} expiré, malformé, ou mauvaise signature.
   */
  verifyToken = (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée');
    }
  };

  /**
   * Hache un mot de passe en clair avec bcrypt. Utilisé par le script de
   * seed admin et par le futur CRUD des utilisateurs admin.
   */
  hashPassword = (plain) => bcrypt.hash(String(plain), BCRYPT_ROUNDS);

  /**
   * Génère un token de réinitialisation et envoie l'e-mail à l'admin.
   *
   * La réponse est TOUJOURS identique, que l'e-mail existe ou non,
   * pour ne pas divulguer quels comptes sont enregistrés (protection
   * contre l'énumération de comptes).
   *
   * @param {string} email - Adresse e-mail saisie dans le formulaire
   */
  forgotPassword = async (email) => {
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();

    if (!Validator.isEmail(normalized)) {
      throw new BadRequestException('Adresse e-mail invalide');
    }

    const user = await userRepository.findByEmail(normalized);

    // Pas d'utilisateur → on sort silencieusement sans rien faire.
    // La réponse HTTP reste 204 pour ne pas révéler l'existence du compte.
    if (!user) return;

    // Token cryptographiquement sûr (64 caractères hex = 32 octets d'entropie).
    const token = randomBytes(32).toString('hex');

    // Date d'expiration : maintenant + TTL configuré (défaut 15 min).
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await userRepository.saveResetToken(user.id, token, expiresAt);

    const resetUrl = `${APP_URL}/admin/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, resetUrl);
  };

  /**
   * Valide le token de réinitialisation et met à jour le mot de passe.
   *
   * @param {string} token       - Token reçu depuis le lien e-mail
   * @param {string} newPassword - Nouveau mot de passe en clair (min 8 chars)
   * @throws {BadRequestException} token invalide/expiré, ou mot de passe trop court
   */
  resetPassword = async (token, newPassword) => {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new BadRequestException('Token invalide');
    }

    const password = String(newPassword ?? '');
    if (password.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Recherche l'utilisateur ET vérifie que le token n'est pas expiré
    // en une seule requête (WHERE reset_token_expires > NOW()).
    const user = await userRepository.findByResetToken(token.trim());
    if (!user) {
      throw new BadRequestException('Ce lien est invalide ou a expiré. Veuillez faire une nouvelle demande.');
    }

    const hashedPassword = await this.hashPassword(password);

    // Met à jour le mot de passe et efface le token en une seule opération.
    await userRepository.updatePasswordAndClearToken(user.id, hashedPassword);
  };
}

export const authService = new AuthService();
