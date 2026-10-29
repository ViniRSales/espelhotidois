import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as solicitacoes from '@/services/solicitacoes';

import { sincronizarFoto } from './fotos';

vi.mock('@/services/solicitacoes');

const servico = vi.mocked(solicitacoes);
const salva = { id: 'f1', url: '/api/fotos/s1/f1.jpg' };
const arquivo = new File(['x'], 'casaco.jpg', { type: 'image/jpeg' });
const nova = { arquivo, url: 'blob:previa' };

describe('sincronizarFoto', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sem foto, não chama a API', async () => {
    await sincronizarFoto('s1', null, null);

    expect(servico.enviarFotoSolicitacao).not.toHaveBeenCalled();
    expect(servico.removerFotoSolicitacao).not.toHaveBeenCalled();
  });

  it('envia a foto escolhida', async () => {
    await sincronizarFoto('s1', null, nova);

    expect(servico.enviarFotoSolicitacao).toHaveBeenCalledWith('s1', arquivo);
  });

  it('mantém a foto que não mudou', async () => {
    await sincronizarFoto('s1', salva, salva);

    expect(servico.enviarFotoSolicitacao).not.toHaveBeenCalled();
    expect(servico.removerFotoSolicitacao).not.toHaveBeenCalled();
  });

  it('troca a foto: apaga a antiga antes de enviar a nova', async () => {
    await sincronizarFoto('s1', salva, nova);

    expect(servico.removerFotoSolicitacao).toHaveBeenCalledWith('s1', 'f1');
    expect(servico.enviarFotoSolicitacao).toHaveBeenCalledWith('s1', arquivo);
    expect(servico.removerFotoSolicitacao.mock.invocationCallOrder[0])
      .toBeLessThan(servico.enviarFotoSolicitacao.mock.invocationCallOrder[0]);
  });

  it('remove a foto quando a pessoa a tira do pedido', async () => {
    await sincronizarFoto('s1', salva, null);

    expect(servico.removerFotoSolicitacao).toHaveBeenCalledWith('s1', 'f1');
    expect(servico.enviarFotoSolicitacao).not.toHaveBeenCalled();
  });
});
