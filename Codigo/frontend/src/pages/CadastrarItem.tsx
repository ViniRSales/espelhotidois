import { FileClock, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import AssistenteCadastro from '@/features/cadastro-doacao/AssistenteCadastro';
import CadastroDoacaoProvider from '@/features/cadastro-doacao/CadastroDoacaoProvider';
import { ApiError } from '@/services/api';
import { buscarDoacao, buscarRascunho, descartarRascunho } from '@/services/doacoes';
import type { Doacao } from '@/types/doacao';

type Carregamento =
    | { situacao: 'carregando' }
    | { situacao: 'retomar'; rascunho: Doacao }
    | { situacao: 'pronto'; rascunho?: Doacao }
    | { situacao: 'erro'; mensagem: string };

function mensagemDeErro(erro: unknown, padrao: string) {
    return erro instanceof ApiError ? erro.message : padrao;
}

/**
 * Cadastro de item (`/adicionar/item` e `/adicionar/item/:id`). Com id, continua aquele rascunho; sem id,
 * oferece continuar o rascunho existente ou começar de novo.
 */
function CadastrarItem() {
    const params = useParams();
    const navigate = useNavigate();
    // Só o id da primeira visita importa: depois o assistente atualiza a URL sozinho, sem recarregar a página.
    const [idInicial] = useState(params.id);
    const [carregamento, setCarregamento] = useState<Carregamento>({ situacao: 'carregando' });
    const [descartando, setDescartando] = useState(false);

    // Carrega uma vez só: o efeito pode rodar de novo quando a URL muda (o `navigate` muda junto),
    // e recarregar ali mostraria a pergunta de rascunho no meio do cadastro.
    const carregou = useRef(false);

    useEffect(() => {
        if (carregou.current) return;
        carregou.current = true;
        const carregar = idInicial ? buscarDoacao(idInicial) : buscarRascunho();
        carregar
            .then((doacao) => {
                if (doacao && doacao.situacao !== 'RASCUNHO') {
                    navigate(`/doacoes/${doacao.id}`, { replace: true });
                } else if (doacao && !idInicial) {
                    setCarregamento({ situacao: 'retomar', rascunho: doacao });
                } else {
                    setCarregamento({ situacao: 'pronto', rascunho: doacao });
                }
            })
            .catch((erro: unknown) => {
                setCarregamento({ situacao: 'erro', mensagem: mensagemDeErro(erro, 'Não conseguimos abrir o cadastro.') });
            });
    }, [idInicial, navigate]);

    async function comecarDeNovo(rascunho: Doacao) {
        setDescartando(true);
        try {
            await descartarRascunho(rascunho.id);
            setCarregamento({ situacao: 'pronto' });
        } catch (erro) {
            setCarregamento({ situacao: 'erro', mensagem: mensagemDeErro(erro, 'Não conseguimos descartar o rascunho.') });
        } finally {
            setDescartando(false);
        }
    }

    if (carregamento.situacao === 'pronto') {
        return (
            <CadastroDoacaoProvider rascunho={carregamento.rascunho}>
                <AssistenteCadastro />
            </CadastroDoacaoProvider>
        );
    }

    return (
        <div className='mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center'>
            {carregamento.situacao === 'carregando' && (
                <p role='status' className='flex items-center gap-2 text-body-l text-muted'>
                    <LoaderCircle size={20} className='animate-spin' aria-hidden />
                    Abrindo o cadastro…
                </p>
            )}

            {carregamento.situacao === 'retomar' && (
                <section className='flex w-full flex-col items-center gap-5 rounded-2xl border border-border/15 bg-surface p-8'>
                    <FileClock size={40} className='text-accent' aria-hidden />
                    <h1 className='text-title-3 leading-tight'>Você tem um rascunho em andamento</h1>
                    <p className='text-body-l leading-snug text-muted'>
                        {carregamento.rascunho.titulo
                            ? <>Quer continuar o cadastro de <strong className='text-foreground'>{carregamento.rascunho.titulo}</strong>?</>
                            : 'Quer continuar de onde parou?'}
                    </p>
                    <div className='flex w-full flex-col gap-3 sm:flex-row sm:justify-center'>
                        <Button variant='outline' loading={descartando} onClick={() => comecarDeNovo(carregamento.rascunho)}>
                            Começar de novo
                        </Button>
                        <Button disabled={descartando} onClick={() => setCarregamento({ situacao: 'pronto', rascunho: carregamento.rascunho })}>
                            Continuar rascunho
                        </Button>
                    </div>
                </section>
            )}

            {carregamento.situacao === 'erro' && (
                <section role='alert' className='flex flex-col items-center gap-4'>
                    <h1 className='text-title-3 leading-tight'>Algo deu errado</h1>
                    <p className='text-body-l leading-snug text-muted'>{carregamento.mensagem}</p>
                    <Link to='/adicionar' className={buttonClasses('primary')}>Voltar para Adicionar</Link>
                </section>
            )}
        </div>
    );
}

export default CadastrarItem;
