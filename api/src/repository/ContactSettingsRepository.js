import { Repository } from '../core/Repository.js';
import { ContactSettings } from '../entity/ContactSettings.js';
import { pool } from '../config/database.js';

class ContactSettingsRepository extends Repository {
  constructor() {
    super('contact_settings', ContactSettings);
  }

  /** Retourne la seule ligne de paramètres (id = 1). */
  findFirst = async () => {
    const [rows] = await pool.query('SELECT * FROM contact_settings LIMIT 1');
    return rows[0] ? new ContactSettings(rows[0]) : null;
  };
}

export const contactSettingsRepository = new ContactSettingsRepository();
