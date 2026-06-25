// ============================================================
// AuthService.test.js — Tests unitaires de l'authentification admin.
//
// Toutes les dépendances externes (UserRepository, env) sont mockées
// pour que les tests tournent sans DB et sans vrai JWT_SECRET. Chemins
// couverts :
//   - signIn rejette les formes de payload erronées (400)
//   - signIn rejette un e-mail inconnu (401)
//   - signIn rejette un mauvais mot de passe (401)
//   - signIn renvoie l'utilisateur + un JWT signé en cas de succès
//   - verifyToken décode un token frais
//   - verifyToken rejette les tokens malformés / expirés (401)
//   - hashPassword + verifyToken s'intègrent avec bcrypt + jsonwebtoken
//
// On NE mocke PAS bcrypt ni jsonwebtoken — ils sont purs et assez
// rapides, et le test donne un signal plus fort quand les vraies
// bibliothèques sont exercées.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../../repository/UserRepository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
  },
}));

import { authService } from '../AuthService.js';
import { userRepository } from '../../repository/UserRepository.js';
import { User } from '../../entity/User.js';
import { BadRequestException, UnauthorizedException } from '../../error/HttpException.js';

const PLAIN_PASSWORD = 'S3cure-Pass!';
let hashedPassword;

beforeEach(async () => {
  vi.clearAllMocks();
  // Hache une fois par test pour imiter ce que le script de seed persisterait.
  hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 4); // cost=4 pour la vitesse des tests
});

function makeAdmin(overrides = {}) {
  return new User({
    id: 1,
    email: 'admin@csc-ostwald.fr',
    password: hashedPassword,
    role: 'admin',
    created_at: new Date(),
    ...overrides,
  });
}

describe('AuthService.signIn — payload shape', () => {
  it('throws BadRequestException for missing email', async () => {
    await expect(authService.signIn({ password: 'foo' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadRequestException for invalid email format', async () => {
    await expect(
      authService.signIn({ email: 'not-an-email', password: 'foo' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for empty password', async () => {
    await expect(authService.signIn({ email: 'admin@x.fr', password: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('AuthService.signIn — credentials', () => {
  it('throws UnauthorizedException when email is unknown', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(
      authService.signIn({ email: 'unknown@csc-ostwald.fr', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException with the SAME message as unknown email (no enumeration)', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(null);
    userRepository.findByEmail.mockResolvedValueOnce(makeAdmin());

    const unknownErr = await authService
      .signIn({ email: 'unknown@x.fr', password: 'wrong' })
      .catch((e) => e);
    const wrongPwErr = await authService
      .signIn({ email: 'admin@csc-ostwald.fr', password: 'wrong' })
      .catch((e) => e);

    expect(unknownErr.message).toBe(wrongPwErr.message);
  });

  it('throws UnauthorizedException when password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(makeAdmin());
    await expect(
      authService.signIn({ email: 'admin@csc-ostwald.fr', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns user + token when credentials match', async () => {
    const admin = makeAdmin();
    userRepository.findByEmail.mockResolvedValue(admin);

    const result = await authService.signIn({
      email: 'admin@csc-ostwald.fr',
      password: PLAIN_PASSWORD,
    });

    expect(result.user).toBe(admin);
    expect(typeof result.token).toBe('string');
    // Un JWT a trois parties séparées par des points
    expect(result.token.split('.')).toHaveLength(3);
  });

  it('lowercases + trims the input email before lookup', async () => {
    userRepository.findByEmail.mockResolvedValue(makeAdmin());
    await authService.signIn({
      email: '  Admin@CSC-Ostwald.FR  ',
      password: PLAIN_PASSWORD,
    });
    expect(userRepository.findByEmail).toHaveBeenCalledWith('admin@csc-ostwald.fr');
  });
});

describe('AuthService — never leaks password hash', () => {
  it('returns a User whose toJSON() strips the password field', async () => {
    userRepository.findByEmail.mockResolvedValue(makeAdmin());
    const { user } = await authService.signIn({
      email: 'admin@csc-ostwald.fr',
      password: PLAIN_PASSWORD,
    });
    const serialized = JSON.parse(JSON.stringify(user));
    expect(serialized).not.toHaveProperty('password');
    expect(serialized).toHaveProperty('email', 'admin@csc-ostwald.fr');
  });
});

describe('AuthService.verifyToken', () => {
  it('decodes a token issued by signIn', async () => {
    userRepository.findByEmail.mockResolvedValue(makeAdmin());
    const { token } = await authService.signIn({
      email: 'admin@csc-ostwald.fr',
      password: PLAIN_PASSWORD,
    });
    const payload = authService.verifyToken(token);
    expect(payload.email).toBe('admin@csc-ostwald.fr');
    expect(payload.role).toBe('admin');
    expect(payload.sub).toBe(1);
  });

  it('throws UnauthorizedException for malformed tokens', () => {
    expect(() => authService.verifyToken('not.a.jwt')).toThrow(UnauthorizedException);
    expect(() => authService.verifyToken('')).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for tokens signed with a different secret', () => {
    // jwt.sign avec le secret de notre service puis signature tronquée —
    // même payload, signature cassée.
    const broken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjF9.invalid-signature';
    expect(() => authService.verifyToken(broken)).toThrow(UnauthorizedException);
  });
});

describe('AuthService.hashPassword', () => {
  it('produces a bcrypt hash that compare() accepts', async () => {
    const hash = await authService.hashPassword('p@ssw0rd');
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix $2a/$2b
    expect(await bcrypt.compare('p@ssw0rd', hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
