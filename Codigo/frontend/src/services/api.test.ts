import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aoExpirarSessao, api, ApiError, definirToken } from './api';

function resposta(status: number, corpo?: unknown) {
    return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status });
}

describe('api', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    it('envia o corpo como JSON', async () => {
        fetchMock.mockResolvedValue(resposta(200, { id: 'd1' }));

        const dados = await api<{ id: string }>('/doacoes', { method: 'POST', body: { titulo: 'Cachecol' } });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/doacoes');
        expect(init?.body).toBe('{"titulo":"Cachecol"}');
        expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
        expect(dados).toEqual({ id: 'd1' });
    });

    it('envia FormData sem converter e sem forçar o Content-Type', async () => {
        fetchMock.mockResolvedValue(resposta(201, { id: 'f1' }));
        const formulario = new FormData();
        formulario.append('arquivo', new Blob(['x'], { type: 'image/jpeg' }), 'a.jpg');

        await api('/doacoes/d1/fotos', { method: 'POST', body: formulario });

        const [, init] = fetchMock.mock.calls[0];
        expect(init?.body).toBe(formulario);
        expect(init?.headers).not.toHaveProperty('Content-Type');
    });

    it('devolve undefined no 204', async () => {
        fetchMock.mockResolvedValue(resposta(204));

        await expect(api('/doacoes/rascunho')).resolves.toBeUndefined();
    });

    it('transforma o erro padronizado em ApiError com os campos', async () => {
        fetchMock.mockResolvedValue(resposta(400, {
            mensagem: 'Confira os campos destacados e tente de novo.',
            campos: [{ campo: 'titulo', mensagem: 'Dê um nome ao item com pelo menos 3 letras.' }],
        }));

        const erro = await api('/doacoes/d1/publicar', { method: 'POST' }).catch((e: unknown) => e);

        expect(erro).toBeInstanceOf(ApiError);
        expect((erro as ApiError).status).toBe(400);
        expect((erro as ApiError).erroDoCampo('titulo')).toBe('Dê um nome ao item com pelo menos 3 letras.');
    });

    it('avisa quando não há conexão', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(api('/categorias')).rejects.toMatchObject({ status: 0 });
    });

    describe('sessão', () => {
        const expirou = vi.fn();
        let cancelar: () => void;

        beforeEach(() => {
            cancelar = aoExpirarSessao(expirou);
        });

        afterEach(() => {
            cancelar();
            definirToken(null);
            expirou.mockReset();
        });

        it('envia o token no cabeçalho Authorization', async () => {
            definirToken('t1');
            fetchMock.mockResolvedValue(resposta(200, {}));

            await api('/auth/eu');

            expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer t1' });
        });

        it('um 401 com token avisa que a sessão expirou', async () => {
            definirToken('t1');
            fetchMock.mockResolvedValue(resposta(401, { mensagem: 'Sua sessão expirou. Entre de novo para continuar.' }));

            await expect(api('/doacoes/rascunho')).rejects.toMatchObject({ status: 401 });
            expect(expirou).toHaveBeenCalledOnce();
        });

        it('um 401 sem token (senha errada no login) não mexe na sessão', async () => {
            fetchMock.mockResolvedValue(resposta(401, { mensagem: 'E-mail ou senha incorretos.' }));

            await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
            expect(expirou).not.toHaveBeenCalled();
        });

        it('cancelar o registro para de avisar', async () => {
            cancelar();
            definirToken('t1');
            fetchMock.mockResolvedValue(resposta(401, {}));

            await api('/doacoes/rascunho').catch(() => {});

            expect(expirou).not.toHaveBeenCalled();
        });
    });
});
