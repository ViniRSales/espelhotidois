import { describe, expect, it } from 'vitest';

import { formularioVazio } from './formulario';
import { formularioCompleto, foto, HOJE } from './testes/dados';
import { hojeLocal, primeiraEtapaComErro, validarEtapa } from './validacao';

const comum = { ehAlimento: false, hoje: HOJE };
const alimento = { ehAlimento: true, hoje: HOJE };

describe('validarEtapa', () => {
  it('aceita um formulário completo em todas as etapas', () => {
    for (const etapa of [1, 2, 3, 4]) {
      expect(validarEtapa(etapa, formularioCompleto(), comum)).toEqual({});
    }
  });

  it('etapa 1 exige nome com 3 letras, descrição e foto', () => {
    const erros = validarEtapa(1, { ...formularioVazio, titulo: ' ab ' }, comum);

    expect(Object.keys(erros)).toEqual(['titulo', 'descricao', 'fotos']);
    expect(erros.titulo).toBe('Dê um nome ao item com pelo menos 3 letras.');
  });

  it('etapa 1 limita a 10 fotos e 300 caracteres de descrição', () => {
    const fotos = Array.from({ length: 11 }, (_, i) => foto(`f${i}`));
    const erros = validarEtapa(1, formularioCompleto({ fotos, descricao: 'x'.repeat(301) }), comum);

    expect(erros.fotos).toBe('Use no máximo 10 fotos.');
    expect(erros.descricao).toBe('A descrição pode ter até 300 caracteres.');
  });

  it('etapa 2 exige categoria', () => {
    expect(validarEtapa(2, formularioCompleto({ categoriaId: null }), comum)).toEqual({ categoriaId: 'Escolha uma categoria.' });
  });

  it('alimento perecível precisa de validade de hoje em diante', () => {
    expect(validarEtapa(2, formularioCompleto(), alimento).validade).toBe('Informe a validade ou marque como não perecível.');
    expect(validarEtapa(2, formularioCompleto({ validade: '2026-10-26' }), alimento).validade)
      .toBe('A validade precisa ser hoje ou uma data futura.');
    expect(validarEtapa(2, formularioCompleto({ validade: HOJE }), alimento)).toEqual({});
    expect(validarEtapa(2, formularioCompleto({ naoPerecivel: true }), alimento)).toEqual({});
  });

  it('fora de alimentos a validade não é exigida', () => {
    expect(validarEtapa(2, formularioCompleto(), comum)).toEqual({});
  });

  it('etapa 3 exige condição e ao menos uma forma de entrega', () => {
    expect(Object.keys(validarEtapa(3, formularioCompleto({ condicao: null, formasEntrega: [] }), comum)))
      .toEqual(['condicao', 'formasEntrega']);
  });

  it('etapa 4 exige bairro e cidade', () => {
    expect(validarEtapa(4, formularioCompleto({ bairro: ' ', cidade: 'B' }), comum))
      .toEqual({ bairro: 'Informe o bairro.', cidade: 'Informe a cidade.' });
  });
});

describe('primeiraEtapaComErro', () => {
  it('aponta a primeira etapa incompleta', () => {
    expect(primeiraEtapaComErro(formularioCompleto({ condicao: null, bairro: '' }), comum)?.etapa).toBe(3);
    expect(primeiraEtapaComErro(formularioCompleto(), comum)).toBeNull();
  });
});

describe('hojeLocal', () => {
  it('usa o fuso do navegador', () => {
    expect(hojeLocal(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
