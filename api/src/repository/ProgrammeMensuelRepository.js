import { Repository } from '../core/Repository.js';
import { ProgrammeMensuel } from '../entity/ProgrammeMensuel.js';
import { pool } from '../config/database.js';

class ProgrammeMensuelRepository extends Repository {
  constructor() {
    super('programme_mensuel', ProgrammeMensuel);
  }

  findPublished = async () => {
    const [rows] = await pool.query(
      'SELECT * FROM programme_mensuel WHERE is_published = 1 ORDER BY annee DESC, mois DESC',
    );
    return rows.map((row) => new ProgrammeMensuel(row));
  };

  findAll = async () => {
    const [rows] = await pool.query(
      'SELECT * FROM programme_mensuel ORDER BY annee DESC, mois DESC',
    );
    return rows.map((row) => new ProgrammeMensuel(row));
  };
}

export const programmeMensuelRepository = new ProgrammeMensuelRepository();
