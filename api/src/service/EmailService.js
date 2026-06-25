// ============================================================
// EmailService.js — Envoi d'e-mails transactionnels via SMTP.
//
// En développement : pointer SMTP_HOST vers Mailtrap (sandbox) pour
// intercepter les mails sans les envoyer réellement.
// En production : renseigner les vraies credentials SMTP du client
// (Gmail, OVH, Outlook…) dans le fichier .env du serveur.
//
// Le transporter est créé une seule fois (singleton) et réutilisé
// pour toutes les demandes — évite d'ouvrir une connexion SMTP à
// chaque appel.
// ============================================================

import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

class EmailService {
  /**
   * Envoie l'e-mail de récupération de mot de passe à l'admin.
   *
   * @param {string} to       - Adresse e-mail du destinataire
   * @param {string} resetUrl - Lien complet avec le token (valable 15 min)
   */
  sendPasswordReset = async (to, resetUrl) => {
    await transporter.sendMail({
      from: `"CSC Ostwald" <${SMTP_FROM}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe — CSC Ostwald',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
          <h2 style="color: #e05c00;">CSC Ostwald — Réinitialisation du mot de passe</h2>
          <p>Bonjour,</p>
          <p>
            Vous avez demandé la réinitialisation du mot de passe de votre compte administrateur.
            Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <p style="text-align: center; margin: 32px 0;">
            <a
              href="${resetUrl}"
              style="
                background: #e05c00;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
              "
            >
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="color: #666; font-size: 0.9rem;">
            Ce lien est valable <strong>15 minutes</strong>. Passé ce délai, vous devrez
            faire une nouvelle demande.
          </p>
          <p style="color: #666; font-size: 0.9rem;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail —
            votre mot de passe restera inchangé.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 0.8rem; color: #999;">
            Centre Social et Culturel d'Ostwald — 1, place de la Bruyère, 67540 Ostwald
          </p>
        </div>
      `,
      // Version texte brut pour les clients mail qui n'affichent pas le HTML
      text: `Réinitialisation du mot de passe — CSC Ostwald\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 15 minutes) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
    });
  };
}

export const emailService = new EmailService();
