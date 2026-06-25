// ============================================================
// Validator.js — Validateurs statiques légers.
//
// Reflète les regex du frontend (`client/src/utils/validators.js`) pour
// que client et serveur rejettent les mêmes chaînes. CLAUDE.md préfère
// cette classe statique à base de regex à une bibliothèque plus lourde
// (Zod/Joi) au niveau du service — les schémas vivent sur le frontend ;
// le backend ne fait que se prémunir contre les entrées malformées.
// ============================================================

export class Validator {
  /**
   * RFC 5322 simplifiée — accepte les formats courants et rejette les
   * âneries évidentes. Même expression que côté client frontend pour que
   * le comportement soit cohérent à travers le réseau.
   */
  static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /** Téléphone français — `+33...` ou `0X XX XX XX XX` avec séparateurs `.`/`-`/` `. */
  static PHONE_FR_REGEX = /^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/;

  /**
   * Sujets autorisés pour le formulaire de contact.
   * MUST stay in sync with client/src/features/contact/schemas/contact.schema.js
   * (`CONTACT_SUBJECTS`). Mismatch = every legit submission with the missing
   * value gets a 400 from the backend.
   */
  static CONTACT_SUBJECTS = ['renseignement', 'inscription', 'benevole', 'partenariat', 'autre'];

  static isEmail(value) {
    return typeof value === 'string' && this.EMAIL_REGEX.test(value);
  }

  static isPhoneFR(value) {
    return typeof value === 'string' && this.PHONE_FR_REGEX.test(value);
  }

  /** True quand `value` est une chaîne non vide d'au plus `maxLength` caractères. */
  static isNonEmptyString(value, { maxLength = Infinity } = {}) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
  }

  /** True quand `value` est l'un des sujets de contact autorisés. */
  static isContactSubject(value) {
    return this.CONTACT_SUBJECTS.includes(value);
  }

  /** True quand chaque élément de `value` est une chaîne non vide. */
  static isStringArray(value) {
    return Array.isArray(value) && value.every((v) => typeof v === 'string' && v.length > 0);
  }
}
