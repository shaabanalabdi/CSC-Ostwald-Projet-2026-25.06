import { programmeMensuelRepository } from '../repository/ProgrammeMensuelRepository.js';
import { ProgrammeMensuel } from '../entity/ProgrammeMensuel.js';
import { NotFoundException, UnprocessableEntityException } from '../error/HttpException.js';

const MOIS_NOMS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

class ProgrammeMensuelService {
  listPublished = async () => programmeMensuelRepository.findPublished();

  listAll = async () => programmeMensuelRepository.findAll();

  getOne = async (id) => {
    const p = await programmeMensuelRepository.find(id);
    if (!p) throw new NotFoundException('Programme introuvable');
    return p;
  };

  create = async (payload) => {
    const data = this._validate(payload);
    const p = new ProgrammeMensuel(data);
    await programmeMensuelRepository.save(p);
    return programmeMensuelRepository.find(p.id);
  };

  update = async (id, payload) => {
    const existing = await this.getOne(id);
    const data = this._validate(payload);
    Object.assign(existing, data);
    await programmeMensuelRepository.save(existing);
    return programmeMensuelRepository.find(id);
  };

  remove = async (id) => {
    const deleted = await programmeMensuelRepository.delete(id);
    if (!deleted) throw new NotFoundException('Programme introuvable');
  };

  _validate = (payload) => {
    const errors = {};
    const data = {};

    const titre = String(payload?.titre ?? '').trim();
    if (titre.length < 2 || titre.length > 200) {
      errors.titre = 'Titre entre 2 et 200 caractères';
    } else {
      data.titre = titre;
    }

    const mois = Number(payload?.mois);
    if (!Number.isInteger(mois) || mois < 1 || mois > 12) {
      errors.mois = 'Mois entre 1 et 12';
    } else {
      data.mois = mois;
      data.mois_nom = MOIS_NOMS[mois - 1];
    }

    const annee = Number(payload?.annee);
    if (!Number.isInteger(annee) || annee < 2020 || annee > 2100) {
      errors.annee = 'Année invalide';
    } else {
      data.annee = annee;
    }

    const imageUrl = String(payload?.image_url ?? '').trim();
    if (!imageUrl) {
      errors.image_url = 'Image requise';
    } else if (!imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http')) {
      errors.image_url = 'URL invalide';
    } else {
      data.image_url = imageUrl;
    }

    const rawPub = payload?.is_published;
    data.is_published = (rawPub === false || rawPub === 0 || rawPub === '0') ? 0 : 1;

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const programmeMensuelService = new ProgrammeMensuelService();
