import { contactSettingsRepository } from '../repository/ContactSettingsRepository.js';
import { ContactSettings } from '../entity/ContactSettings.js';
import { UnprocessableEntityException } from '../error/HttpException.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  phone: { max: 30 },
  email: { max: 100 },
  address: { max: 255 },
};

class ContactSettingsService {
  get = async () => {
    let settings = await contactSettingsRepository.findFirst();
    if (!settings) {
      // Initialise la ligne par défaut si elle n'existe pas encore.
      settings = new ContactSettings({
        phone: '09.78.80.96.29',
        email_accueil: 'contact@csc-ostwald.fr',
        email_familles: 'familles@csc-ostwald.fr',
        email_jeunesse: 'jeunesse@csc-ostwald.fr',
        email_projets: 'projets@csc-ostwald.fr',
        address: '1, place de la Bruyère, 67540 Ostwald',
        days_lv: 'Lundi – Vendredi',
        hours_lv: '09h30 – 17h00',
        days_we: 'Samedi – Dimanche',
        hours_we: 'Fermé',
        exceptional_day: null,
        exceptional_occasion: null,
      });
      await contactSettingsRepository.save(settings);
    }
    return settings;
  };

  update = async (payload) => {
    const existing = await this.get();
    const data = this._validate(payload);
    Object.assign(existing, data);
    await contactSettingsRepository.save(existing);
    return existing;
  };

  _validate = (payload) => {
    const errors = {};
    const data = {};

    const phone = String(payload?.phone ?? '').trim();
    if (phone.length === 0 || phone.length > LIMITS.phone.max) {
      errors.phone = `Téléphone requis (max ${LIMITS.phone.max} car.)`;
    } else {
      data.phone = phone;
    }

    for (const field of ['email_accueil', 'email_familles', 'email_jeunesse', 'email_projets']) {
      const val = String(payload?.[field] ?? '').trim();
      if (!EMAIL_RE.test(val) || val.length > LIMITS.email.max) {
        errors[field] = 'Email invalide';
      } else {
        data[field] = val;
      }
    }

    const address = String(payload?.address ?? '').trim();
    if (address.length === 0 || address.length > LIMITS.address.max) {
      errors.address = `Adresse requise (max ${LIMITS.address.max} car.)`;
    } else {
      data.address = address;
    }

    const days_lv = String(payload?.days_lv ?? '').trim();
    if (days_lv.length === 0) {
      errors.days_lv = 'Jours requis';
    } else {
      data.days_lv = days_lv;
    }

    const hours_lv = String(payload?.hours_lv ?? '').trim();
    if (hours_lv.length === 0) {
      errors.hours_lv = 'Horaires requis';
    } else {
      data.hours_lv = hours_lv;
    }

    const days_we = String(payload?.days_we ?? '').trim();
    if (days_we.length === 0) {
      errors.days_we = 'Jours requis';
    } else {
      data.days_we = days_we;
    }

    const hours_we = String(payload?.hours_we ?? '').trim();
    if (hours_we.length === 0) {
      errors.hours_we = 'Horaires requis';
    } else {
      data.hours_we = hours_we;
    }

    const rawDay = payload?.exceptional_day;
    data.exceptional_day =
      rawDay == null || String(rawDay).trim() === '' ? null : String(rawDay).trim().slice(0, 100);

    const rawOccasion = payload?.exceptional_occasion;
    data.exceptional_occasion =
      rawOccasion == null || String(rawOccasion).trim() === ''
        ? null
        : String(rawOccasion).trim().slice(0, 255);

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException('Validation échouée', { fields: errors });
    }

    return data;
  };
}

export const contactSettingsService = new ContactSettingsService();
