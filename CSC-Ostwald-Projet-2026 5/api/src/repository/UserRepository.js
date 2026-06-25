// ============================================================
// UserRepository.js — CRUD pour la table `user` (comptes admin).
// Singleton ; ajoute `findByEmail` car l'e-mail est la clé de connexion
// naturelle, et les méthodes de gestion du token de réinitialisation
// de mot de passe.
// ============================================================

import { Repository } from '../core/Repository.js';
import { User } from '../entity/User.js';
import { pool } from '../config/database.js';

class UserRepository extends Repository {
  constructor() {
    super('user', User);
  }

  /**
   * Helper du parcours de connexion. Met toujours l'entrée en minuscules
   * et la rogne. La table `user` utilise utf8mb4_unicode_ci, donc la
   * contrainte UNIQUE est elle-même INSENSIBLE à la casse — mais
   * normaliser ici garde la recherche déterministe sur les déploiements
   * qui pourraient choisir une collation différente, et évite de
   * propager des données en casse mixte dans les logs / réponses en aval.
   * @returns {Promise<User|null>}
   */
  findByEmail = async (email) => {
    const normalized = String(email ?? '')
      .trim()
      .toLowerCase();
    if (normalized === '') return null;
    return this.findOneBy({ email: normalized });
  };

  /**
   * Recherche un utilisateur par son token de réinitialisation de mot de passe.
   * Vérifie simultanément que le token n'est pas expiré côté base de données.
   * @returns {Promise<User|null>}
   */
  findByResetToken = async (token) => {
    if (!token) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM `user` WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
      [token],
    );
    if (!rows.length) return null;
    return new User(rows[0]);
  };

  /**
   * Sauvegarde le token de réinitialisation et sa date d'expiration
   * pour l'utilisateur donné.
   */
  saveResetToken = async (userId, token, expiresAt) => {
    await pool.execute(
      'UPDATE `user` SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expiresAt, userId],
    );
  };

  /**
   * Met à jour le mot de passe (déjà hashé) et efface le token de
   * réinitialisation pour qu'il ne puisse pas être réutilisé.
   */
  updatePasswordAndClearToken = async (userId, hashedPassword) => {
    await pool.execute(
      'UPDATE `user` SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, userId],
    );
  };
}

export const userRepository = new UserRepository();
