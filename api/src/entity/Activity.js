// ============================================================
// Activity.js — Entité Activité (Famille / Jeunesse / Régulière).
//
// Adossée à la table `activity`. Voir database.sql §3 pour la liste des
// colonnes. Tous les champs sont hydratés par le constructeur de base
// d'Entity via Object.assign.
// ============================================================

import { Entity } from '../core/Entity.js';

export class Activity extends Entity {}
