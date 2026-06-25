// ============================================================
// TeamMemberService.test.js — Tests unitaires du module équipe.
//
// Singleton de repository mocké — pas de DB nécessaire. Couvre :
//   - la validation des champs obligatoires (nom/prenom/role)
//   - la validation de l'e-mail (optionnel, mis en minuscules + rogné quand fourni)
//   - les cas limites de photo_url + display_order
//   - le câblage CRUD (NotFound, save appelé, pas de persistance non voulue)
//   - listAllOrdered délègue à la requête personnalisée du repo
//   - toPublicJSON retire le champ e-mail (forme de l'endpoint public)
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../repository/TeamMemberRepository.js', () => ({
  teamMemberRepository: {
    find: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findPaginated: vi.fn(),
    findAllOrdered: vi.fn(),
  },
}));

import { teamMemberService } from '../TeamMemberService.js';
import { teamMemberRepository } from '../../repository/TeamMemberRepository.js';
import { TeamMember } from '../../entity/TeamMember.js';
import { NotFoundException, UnprocessableEntityException } from '../../error/HttpException.js';

const VALID_PAYLOAD = {
  nom: 'ENETTE',
  prenom: 'Etienne',
  role: 'Directeur',
  email: 'etienne@csc-ostwald.fr',
  display_order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TeamMemberService.create — validation', () => {
  it('rejects missing nom', async () => {
    const err = await teamMemberService.create({ ...VALID_PAYLOAD, nom: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('nom');
  });

  it('rejects missing role', async () => {
    const err = await teamMemberService.create({ ...VALID_PAYLOAD, role: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('role');
  });

  it('rejects an obviously malformed email', async () => {
    const err = await teamMemberService
      .create({ ...VALID_PAYLOAD, email: 'not-an-email' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('email');
  });

  it('accepts an empty email and stores null', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });

    await teamMemberService.create({ ...VALID_PAYLOAD, email: '' });
    const saved = teamMemberRepository.save.mock.calls[0][0];
    expect(saved.email).toBeNull();
  });

  it('lowercases + trims the email', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });

    await teamMemberService.create({ ...VALID_PAYLOAD, email: '  Etienne@CSC-Ostwald.FR  ' });
    const saved = teamMemberRepository.save.mock.calls[0][0];
    expect(saved.email).toBe('etienne@csc-ostwald.fr');
  });

  it('defaults display_order to 0 when omitted', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });

    const { display_order: _omit, ...withoutOrder } = VALID_PAYLOAD;
    void _omit;
    await teamMemberService.create(withoutOrder);
    const saved = teamMemberRepository.save.mock.calls[0][0];
    expect(saved.display_order).toBe(0);
  });

  it('rejects a non-numeric display_order', async () => {
    const err = await teamMemberService
      .create({ ...VALID_PAYLOAD, display_order: 'oops' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('display_order');
  });

  it('accepts a negative display_order (pinned-to-top sentinel)', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });

    await teamMemberService.create({ ...VALID_PAYLOAD, display_order: -1 });
    expect(teamMemberRepository.save.mock.calls[0][0].display_order).toBe(-1);
  });

  it('drops unknown fields from the payload', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });

    await teamMemberService.create({ ...VALID_PAYLOAD, evil: '<script>', id: 9999 });
    const saved = teamMemberRepository.save.mock.calls[0][0];
    expect(saved).not.toHaveProperty('evil');
    expect(saved.id).toBeNull();
  });
});

describe('TeamMemberService.update', () => {
  it('throws NotFoundException when not found', async () => {
    teamMemberRepository.find.mockResolvedValue(null);
    await expect(teamMemberService.update(99, VALID_PAYLOAD)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('merges validated payload onto the existing row', async () => {
    const existing = { id: 1, nom: 'Old', prenom: 'O', role: 'R' };
    teamMemberRepository.find.mockResolvedValueOnce(existing);
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValueOnce({ id: 1, ...VALID_PAYLOAD });

    await teamMemberService.update(1, VALID_PAYLOAD);
    expect(teamMemberRepository.save).toHaveBeenCalledTimes(1);
    const saved = teamMemberRepository.save.mock.calls[0][0];
    expect(saved.id).toBe(1);
    expect(saved.nom).toBe('ENETTE');
  });
});

describe('TeamMemberService.remove', () => {
  it('throws NotFoundException when nothing was deleted', async () => {
    teamMemberRepository.delete.mockResolvedValue(false);
    await expect(teamMemberService.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolves silently on successful delete', async () => {
    teamMemberRepository.delete.mockResolvedValue(true);
    await expect(teamMemberService.remove(1)).resolves.toBeUndefined();
  });
});

describe('TeamMemberService.listAllOrdered', () => {
  it('forwards directly to the repository', async () => {
    teamMemberRepository.findAllOrdered.mockResolvedValue([]);
    await teamMemberService.listAllOrdered();
    expect(teamMemberRepository.findAllOrdered).toHaveBeenCalledTimes(1);
  });
});

describe('TeamMember.toPublicJSON', () => {
  it('returns every field (public page renders email + phone)', () => {
    const m = new TeamMember({
      id: 1,
      nom: 'X',
      prenom: 'Y',
      role: 'Animateur',
      email: 'work@csc-ostwald.fr',
      phone: '07.45.09.96.02',
      photo_url: '/p.jpg',
      display_order: 0,
    });
    expect(m.toPublicJSON()).toEqual({
      id: 1,
      nom: 'X',
      prenom: 'Y',
      role: 'Animateur',
      email: 'work@csc-ostwald.fr',
      phone: '07.45.09.96.02',
      photo_url: '/p.jpg',
      display_order: 0,
    });
  });

  it('returns a new object — mutating it must not affect the entity', () => {
    const m = new TeamMember({ id: 1, nom: 'X', prenom: 'Y', role: 'Animateur' });
    const safe = m.toPublicJSON();
    safe.nom = 'TAMPERED';
    expect(m.nom).toBe('X');
  });
});

describe('TeamMemberService — phone validation', () => {
  it('accepts a valid French phone in standard format', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });
    await teamMemberService.create({ ...VALID_PAYLOAD, phone: '07.45.09.96.02' });
    expect(teamMemberRepository.save.mock.calls[0][0].phone).toBe('07.45.09.96.02');
  });

  it('rejects a malformed phone', async () => {
    const err = await teamMemberService
      .create({ ...VALID_PAYLOAD, phone: 'not-a-number' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.details.fields).toHaveProperty('phone');
  });

  it('accepts an empty phone and stores null', async () => {
    teamMemberRepository.save.mockResolvedValue(undefined);
    teamMemberRepository.find.mockResolvedValue({ id: 1 });
    await teamMemberService.create({ ...VALID_PAYLOAD, phone: '' });
    expect(teamMemberRepository.save.mock.calls[0][0].phone).toBeNull();
  });
});
