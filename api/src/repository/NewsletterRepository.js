// ============================================================
// NewsletterRepository.js — CRUD pour newsletter_subscriber.
//
// Exposé en singleton (`newsletterRepository`) afin que chaque
// consommateur partage la même instance — correspond au motif Pokédex
// référencé dans CLAUDE.md (« Export singleton pour chaque Repository »).
// ============================================================

import { Repository } from '../core/Repository.js';
import { NewsletterSubscriber } from '../entity/NewsletterSubscriber.js';

class NewsletterRepository extends Repository {
  constructor() {
    super('newsletter_subscriber', NewsletterSubscriber);
  }

  // Aucune requête personnalisée — les méthodes génériques de Repository
  // couvrent les besoins actuels (`findAllOrdered` alimente l'export CSV
  // admin, `findOneBy` la vérification du double opt-in). Ajouter les
  // requêtes du domaine ici quand elles apparaissent (ex.
  // `findUnconfirmedOlderThan(date)` pour une tâche de nettoyage).
}

export const newsletterRepository = new NewsletterRepository();
