// ============================================================
// BenevoleApplication.js — Entité Candidature bénévole.
//
// Adossée à la table `benevole_application` (voir database.sql §10).
// À noter : `domaines`, `competences`, `jours`, `plages` sont des
// colonnes JSON — mysql2 les hydrate en tableaux JS à la lecture, et
// les sérialise automatiquement à l'écriture lorsqu'elles sont liées
// en tant que paramètres.
// ============================================================

import { Entity } from '../core/Entity.js';

export class BenevoleApplication extends Entity {}
