// ============================================================
// BenevoleApplicationRepository.js — CRUD pour benevole_application.
// Singleton. tableName = 'benevole_application'.
// ============================================================

import { Repository } from '../core/Repository.js';
import { BenevoleApplication } from '../entity/BenevoleApplication.js';

class BenevoleApplicationRepository extends Repository {
  constructor() {
    super('benevole_application', BenevoleApplication);
  }
}

export const benevoleApplicationRepository = new BenevoleApplicationRepository();
