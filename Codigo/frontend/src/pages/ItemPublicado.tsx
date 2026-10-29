import { Bell, HandHeart, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';
import InfoBanner from '@/components/InfoBanner';
import ItemCard from '@/components/ItemCard';
import { ApiError } from '@/services/api';
import { buscarDoacao } from '@/services/doacoes';
import { rotuloCondicao, rotuloFormaEntrega, type Doacao } from '@/types/doacao';
import { formatarData } from '@/utils/datas';

type Carregamento =
    | { situacao: 'carregando' }
    | { situacao: 'pronto'; doacao: Doacao }
    | { situacao: 'erro'; mensagem: string };

/** Confirmação depois de publicar (`/adicionar/item/:id/publicado`). */
function ItemPublicado() {
    const { id = '' } = useParams();
    const [carregamento, setCarregamento] = useState<Carregamento>({ situacao: 'carregando' });

    useEffect(() => {
        let ativo = true;
        buscarDoacao(id)
            .then((doacao) => ativo && setCarregamento({ situacao: 'pronto', doacao }))
            .catch((erro: unknown) => {
                const mensagem = erro instanceof ApiError ? erro.message : 'Não conseguimos carregar o item.';
                if (ativo) setCarregamento({ situacao: 'erro', mensagem });
            });
        return () => {
            ativo = false;
        };
    }, [id]);

    if (carregamento.situacao === 'carregando') {
        return (
            <p role='status' className='flex items-center justify-center gap-2 py-16 text-body-l text-muted'>
                <LoaderCircle size={20} className='animate-spin' aria-hidden />
                Carregando…
            </p>
        );
    }

    if (carregamento.situacao === 'erro') {
        return (
            <section role='alert' className='mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center'>
                <h1 className='text-title-3 leading-tight'>Algo deu errado</h1>
                <p className='text-body-l leading-snug text-muted'>{carregamento.mensagem}</p>
                <Link to='/adicionar' className={buttonClasses('primary')}>Voltar para Adicionar</Link>
            </section>
        );
    }

    const { doacao } = carregamento;
    // Um rascunho ainda não foi publicado: volta para o cadastro.
    if (doacao.situacao === 'RASCUNHO') {
        return <Navigate to={`/adicionar/item/${doacao.id}`} replace />;
    }

    const nome = doacao.titulo?.toLocaleLowerCase('pt-BR') ?? 'item';
    const chips = [
        doacao.categoria?.nome,
        rotuloCondicao(doacao.condicao),
        doacao.formasEntrega[0] && rotuloFormaEntrega(doacao.formasEntrega[0]),
    ].filter((chip): chip is string => Boolean(chip));

    return (
        <div className='mx-auto grid max-w-5xl items-start gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]'>
            <section className='flex flex-col gap-6'>
                <span className='flex size-20 items-center justify-center rounded-full bg-accent/15 text-accent' aria-hidden>
                    <HandHeart size={40} />
                </span>
                <div className='flex flex-col gap-3'>
                    <h1 className='text-title-1 leading-tight'>Item publicado!</h1>
                    <p className='text-body-l leading-snug'>
                        Seu {nome} já está visível para pessoas próximas
                        {doacao.expiraEm && <> e fica disponível até <strong>{formatarData(doacao.expiraEm)}</strong></>}.
                    </p>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row'>
                    <Link to={`/doacoes/${doacao.id}`} className={buttonClasses('outline')}>Ver meu item</Link>
                    <Link to='/adicionar/item' className={buttonClasses('primary')}>Cadastrar outro item</Link>
                </div>

                <InfoBanner title='Vamos te avisar antes do prazo' icon={<Bell size={18} />}>
                    Perto do fim do prazo, você vai poder estender o anúncio por mais 30 dias.
                </InfoBanner>
            </section>

            <aside aria-labelledby='previa-publicada' className='flex flex-col gap-3 rounded-2xl border border-border/15 bg-surface p-5'>
                <h2 id='previa-publicada' className='text-subtitle'>Pré-visualização</h2>
                <p className='text-caption text-muted'>Assim seu item aparece para outras pessoas.</p>
                <ItemCard
                    title={doacao.titulo ?? undefined}
                    description={doacao.descricao ?? undefined}
                    photoUrl={doacao.fotos[0]?.url}
                    chips={chips}
                    location={doacao.localizacao?.bairro ?? undefined}
                />
            </aside>
        </div>
    );
}

export default ItemPublicado;
