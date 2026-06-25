// ============================================================
// Event.js — Entité Événement de l'agenda (daté, non récurrent).
//
// Adossée à la table `event`. Voir database.sql §4. Hydratée par la
// base Entity via Object.assign — aucun champ personnalisé nécessaire.
// ============================================================

import { Entity } from '../core/Entity.js';

export class Event extends Entity {}
