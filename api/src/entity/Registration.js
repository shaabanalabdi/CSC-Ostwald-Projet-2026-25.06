// ============================================================
// Registration.js — Inscription payante à une activité Jeunesse.
//
// Adossée à la table `registration` (database.sql §8). Les visiteurs
// n'ont pas de compte sur ce site — le parcours de paiement (HelloAsso)
// collecte leur identité, et le webhook écrit la ligne ici.
// ============================================================

import { Entity } from '../core/Entity.js';

export class Registration extends Entity {}
