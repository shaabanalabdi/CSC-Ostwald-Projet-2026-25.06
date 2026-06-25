// ============================================================
// client.test.js — Tests du wrapper fetch (apiPost + ApiError)
//
// On utilise MSW (déjà branché dans test/setup.js) pour intercepter
// les appels et simuler les différents codes HTTP / payloads.
// ============================================================
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { apiPost, ApiError, isApiError } from '../client';
describe('apiPost', () => {
  it('parse une réponse 2xx JSON et retourne le payload typé', async () => {
    server.use(
      http.post('/api/echo', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ doubled: body.value * 2 }, { status: 200 });
      })
    );
    const result = await apiPost('/echo', { value: 21 });
    expect(result.doubled).toBe(42);
  });
  it('gère un 204 No Content (corps vide)', async () => {
    server.use(http.post('/api/empty', () => new HttpResponse(null, { status: 204 })));
    const result = await apiPost('/empty', {});
    expect(result).toBeUndefined();
  });
  it("lève ApiError sur 400 et transporte le payload d'erreur", async () => {
    server.use(
      http.post('/api/bad', () =>
        HttpResponse.json({ message: 'Email déjà utilisé', field: 'email' }, { status: 400 })
      )
    );
    await expect(apiPost('/bad', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Email déjà utilisé',
      payload: { message: 'Email déjà utilisé', field: 'email' },
    });
  });
  it('lève ApiError sur 500 avec fallback message si pas de JSON', async () => {
    server.use(
      http.post(
        '/api/down',
        () => new HttpResponse('boom', { status: 500, statusText: 'Server Error' })
      )
    );
    try {
      await apiPost('/down', {});
      expect.fail('apiPost aurait dû throw');
    } catch (e) {
      expect(isApiError(e)).toBe(true);
      if (isApiError(e)) {
        expect(e.status).toBe(500);
        // Pas de JSON parseable → fallback sur statusText
        expect(e.message).toBe('Server Error');
        expect(e.payload).toBeUndefined();
      }
    }
  });
  it('isApiError discrimine bien (true pour ApiError, false pour Error standard)', () => {
    expect(isApiError(new ApiError(404, 'Not Found'))).toBe(true);
    expect(isApiError(new Error('plain'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });
  it('sérialise correctement le body en JSON', async () => {
    let captured = null;
    server.use(
      http.post('/api/capture', async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ ok: true }, { status: 201 });
      })
    );
    await apiPost('/capture', { hello: 'world', nested: { a: 1 } });
    expect(captured).toEqual({ hello: 'world', nested: { a: 1 } });
  });
});
