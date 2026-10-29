import { useLayoutEffect, useReducer, useRef, type ReactNode } from 'react';

import { DOACAO } from '@/config/doacao';
import { useCategorias } from '@/hooks/useCategorias';
import { ApiError } from '@/services/api';
import * as doacoes from '@/services/doacoes';
import type { Doacao } from '@/types/doacao';

import { CadastroDoacaoContext, type CadastroDoacao } from './contexto';
import { cadastroReducer, estadoInicial, type EstadoCadastro } from './estado';
import { campoDaApi, formularioDaDoacao, rascunhoDoFormulario, type Erros, type FormularioDoacao } from './formulario';
import { etapaDoCampo, hojeLocal, primeiraEtapaComErro, TOTAL_ETAPAS, validarEtapa } from './validacao';

interface CadastroDoacaoProviderProps {
    /** Rascunho a continuar; sem ele, o cadastro começa vazio. */
    rascunho?: Doacao;
    children: ReactNode;
}

const ERRO_INESPERADO = 'Algo deu errado. Tente de novo em instantes.';

/** Converte o erro da API em erros por campo e uma mensagem geral. */
function errosDaApi(erro: unknown): { erros: Erros; erroGeral: string } {
    if (!(erro instanceof ApiError)) return { erros: {}, erroGeral: ERRO_INESPERADO };
    const erros: Erros = {};
    for (const { campo, mensagem } of erro.campos) {
        const nome = campoDaApi(campo);
        if (nome && !erros[nome]) erros[nome] = mensagem;
    }
    return { erros, erroGeral: erro.message };
}

function ehCategoriaAlimentos(nome: string | undefined) {
    return nome === DOACAO.categoriaAlimentos;
}

/** Estado inicial de um rascunho retomado: abre na primeira etapa que ainda falta preencher. */
function estadoDoRascunho(rascunho: Doacao | undefined): EstadoCadastro {
    if (!rascunho) return estadoInicial;
    const contexto = { ehAlimento: ehCategoriaAlimentos(rascunho.categoria?.nome), hoje: hojeLocal() };
    const pendente = primeiraEtapaComErro(formularioDaDoacao(rascunho), contexto);
    return cadastroReducer(estadoInicial, { tipo: 'carregar', doacao: rascunho, etapa: pendente?.etapa ?? TOTAL_ETAPAS });
}

/** Mantém o assistente de cadastro e conversa com a API (rascunho, fotos, publicação). */
function CadastroDoacaoProvider({ rascunho, children }: CadastroDoacaoProviderProps) {
    const [estado, dispatch] = useReducer(cadastroReducer, rascunho, estadoDoRascunho);
    const { categorias, carregando: carregandoCategorias } = useCategorias();

    // As ações são assíncronas: leem o estado mais recente por esta referência, não pelo da renderização em que foram criadas.
    const atual = useRef(estado);
    useLayoutEffect(() => {
        atual.current = estado;
    }, [estado]);

    // Evita criar dois rascunhos quando a primeira foto e o "Continuar" chegam juntos.
    const criacao = useRef<Promise<Doacao | null> | null>(null);

    const categoriaEscolhida = categorias.find((categoria) => categoria.id === estado.formulario.categoriaId);
    const ehAlimento = ehCategoriaAlimentos(categoriaEscolhida?.nome);

    function contextoValidacao(formulario: FormularioDoacao) {
        const nome = categorias.find((categoria) => categoria.id === formulario.categoriaId)?.nome;
        return { ehAlimento: ehCategoriaAlimentos(nome), hoje: hojeLocal() };
    }

    async function salvar(): Promise<Doacao | null> {
        const { id, formulario } = atual.current;
        if (!id && criacao.current) return criacao.current;

        dispatch({ tipo: 'salvando' });
        const operacao = (async () => {
            try {
                const dados = rascunhoDoFormulario(formulario);
                const salva = id ? await doacoes.atualizarRascunho(id, dados) : await doacoes.criarRascunho(dados);
                dispatch({ tipo: 'salvo', doacao: salva });
                return salva;
            } catch (erro) {
                // Só uma criação que falhou pode ser tentada de novo; a que deu certo segue valendo até o id chegar ao estado.
                if (!id) criacao.current = null;
                dispatch({ tipo: 'falhou', ...errosDaApi(erro) });
                return null;
            }
        })();
        if (!id) criacao.current = operacao;
        return operacao;
    }

    async function garantirRascunho(): Promise<string | null> {
        return atual.current.id ?? (await salvar())?.id ?? null;
    }

    const valor: CadastroDoacao = {
        estado,
        categorias,
        carregandoCategorias,
        categoriaEscolhida,
        ehAlimento,

        alterar(campos) {
            // Validade só existe para alimentos: trocar de categoria limpa os dois campos.
            const trocouCategoria = 'categoriaId' in campos && campos.categoriaId !== atual.current.formulario.categoriaId;
            dispatch({ tipo: 'alterar', campos: trocouCategoria ? { ...campos, validade: '', naoPerecivel: false } : campos });
        },

        irParaEtapa(etapa) {
            if (etapa <= atual.current.etapaMaxima) dispatch({ tipo: 'irPara', etapa });
        },

        voltar() {
            dispatch({ tipo: 'irPara', etapa: atual.current.etapa - 1 });
        },

        async continuar() {
            const { etapa, formulario } = atual.current;
            const erros = validarEtapa(etapa, formulario, contextoValidacao(formulario));
            if (Object.keys(erros).length > 0) {
                dispatch({ tipo: 'falhou', erros });
                return false;
            }
            if (!(await salvar())) return false;
            dispatch({ tipo: 'irPara', etapa: etapa + 1 });
            return true;
        },

        async salvarRascunho() {
            return (await salvar()) !== null;
        },

        async adicionarFotos(arquivos) {
            const { fotos } = DOACAO;
            const vagas = fotos.maximo - atual.current.formulario.fotos.length - atual.current.enviandoFotos;
            const aceitos = arquivos.filter((arquivo) =>
                (fotos.tiposPermitidos as readonly string[]).includes(arquivo.type)
                && arquivo.size <= fotos.tamanhoMaximoMb * 1024 * 1024);
            const enviar = aceitos.slice(0, Math.max(vagas, 0));

            const avisos: string[] = [];
            if (aceitos.length < arquivos.length) {
                avisos.push(`Use fotos JPG, PNG ou WEBP de até ${fotos.tamanhoMaximoMb} MB.`);
            }
            if (enviar.length < aceitos.length) {
                avisos.push(`Você pode adicionar até ${fotos.maximo} fotos.`);
            }
            if (enviar.length === 0) {
                if (avisos.length) dispatch({ tipo: 'falhou', erros: { ...atual.current.erros, fotos: avisos.join(' ') } });
                return;
            }

            dispatch({ tipo: 'enviandoFotos', quantidade: enviar.length });
            const id = await garantirRascunho();
            if (!id) {
                dispatch({ tipo: 'enviandoFotos', quantidade: -enviar.length });
                return;
            }
            for (const arquivo of enviar) {
                try {
                    dispatch({ tipo: 'fotoAdicionada', foto: await doacoes.enviarFoto(id, arquivo) });
                } catch (erro) {
                    avisos.push(erro instanceof ApiError ? (erro.campos[0]?.mensagem ?? erro.message) : ERRO_INESPERADO);
                } finally {
                    dispatch({ tipo: 'enviandoFotos', quantidade: -1 });
                }
            }
            if (avisos.length) dispatch({ tipo: 'falhou', erros: { ...atual.current.erros, fotos: avisos.join(' ') } });
        },

        async removerFoto(fotoId) {
            const { id } = atual.current;
            try {
                if (id) await doacoes.removerFoto(id, fotoId);
                dispatch({ tipo: 'fotoRemovida', fotoId });
            } catch (erro) {
                dispatch({ tipo: 'falhou', erroGeral: errosDaApi(erro).erroGeral });
            }
        },

        tornarCapa(fotoId) {
            const { fotos } = atual.current.formulario;
            const capa = fotos.find((foto) => foto.id === fotoId);
            if (capa) dispatch({ tipo: 'alterar', campos: { fotos: [capa, ...fotos.filter((foto) => foto !== capa)] } });
        },

        async publicar() {
            const { formulario, sujo } = atual.current;
            const pendente = primeiraEtapaComErro(formulario, contextoValidacao(formulario));
            if (pendente) {
                dispatch({ tipo: 'irPara', etapa: pendente.etapa });
                dispatch({ tipo: 'falhou', erros: pendente.erros });
                return null;
            }

            const id = sujo || !atual.current.id ? (await salvar())?.id : atual.current.id;
            if (!id) return null;

            dispatch({ tipo: 'salvando' });
            try {
                const publicada = await doacoes.publicarDoacao(id);
                dispatch({ tipo: 'salvo', doacao: publicada });
                return publicada;
            } catch (erro) {
                const { erros, erroGeral } = errosDaApi(erro);
                const [primeiro] = Object.keys(erros) as (keyof Erros)[];
                if (primeiro) dispatch({ tipo: 'irPara', etapa: etapaDoCampo(primeiro) });
                dispatch({ tipo: 'falhou', erros, erroGeral });
                return null;
            }
        },

        async descartar() {
            const { id } = atual.current;
            if (!id) return true;
            try {
                await doacoes.descartarRascunho(id);
                return true;
            } catch (erro) {
                dispatch({ tipo: 'falhou', erroGeral: errosDaApi(erro).erroGeral });
                return false;
            }
        },
    };

    return <CadastroDoacaoContext.Provider value={valor}>{children}</CadastroDoacaoContext.Provider>;
}

export default CadastroDoacaoProvider;
