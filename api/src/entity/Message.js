// ============================================================
// Message.js — Entité du domaine pour les soumissions du formulaire
// de contact.
//
// Adossée à la table `message` (voir database.sql §7). Champs :
//   id, prenom, nom, email, telephone, sujet, message,
//   is_read, created_at
// ============================================================

import { Entity } from '../core/Entity.js';

export class Message extends Entity {}
