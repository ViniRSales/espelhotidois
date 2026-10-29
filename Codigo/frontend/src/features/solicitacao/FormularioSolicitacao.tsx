import { CircleAlert, ShieldCheck } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import InfoBanner from '@/components/InfoBanner';
import PageHeader from '@/components/PageHeader';
import ProgressStepper from '@/components/ProgressStepper/ProgressStepper';
import { useCategorias } from '@/hooks/useCategorias';
import { ApiError } from '@/services/api';
import type { SolicitacaoRequisicao } from '@/types/solicitacao';

import EtapaCategoriaUrgencia from './EtapaCategoriaUrgencia';
import EtapaOQuePrecisa from './EtapaOQuePrecisa';
import EtapaRevisar from './EtapaRevisar';
import {
    errosDaApi,
    errosDaEtapa,
    etapaDoPrimeiroErro,
    paraRequisicao,
    temErros,
    validar,
    type CampoFormulario,
    type Erros,
    type FotoFormulario,
    type Formulario,
} from './formulario';
import SolicitacaoCard from './SolicitacaoCard';

const TEXTOS = {
    cadastro: {
        titulo: 'Cadastrar pedido de doação',
        ultimaEtapa: 'Revisar e publicar',
        pergunta: 'Tudo certo para publicar?',
        enviar: 'Publicar pedido',
    },
    edicao: {
        titulo: 'Editar pedido',
        ultimaEtapa: 'Revisar e salvar',
        pergunta: 'Tudo certo para salvar?',
        enviar: 'Salvar alterações',
    },
};

const AVISO_ERROS = 'Falta pouco: confira os campos destacados.';

interface FormularioSolicitacaoProps {
    modo: 'cadastro' | 'edicao';
    inicial: Formulario;
    /** Para onde vão o "voltar" e o "Cancelar" do cabeçalho. */
    saidaPara: string;
    /** Salva o pedido; a foto vai à parte porque só pode ser enviada depois que o pedido existe. */
    aoEnviar: (dados: SolicitacaoRequisicao, foto: FotoFormulario | null) => Promise<void>;
}

/** Assistente em 3 etapas para cadastrar ou editar um pedido. Confere cada etapa antes de avançar. */
function FormularioSolicitacao({ modo, inicial, saidaPara, aoEnviar }: FormularioSolicitacaoProps) {
    const textos = TEXTOS[modo];
    const nomesEtapas = ['Título e descrição', 'Categoria e urgência', textos.ultimaEtapa];
    const cabecalhos = [
        { titulo: 'Do que você precisa?', texto: 'Conte com suas palavras. Quanto mais claro, mais fácil para alguém ajudar.' },
        { titulo: 'Que tipo de item e para quando?', texto: 'Assim seu pedido chega a quem tem itens parecidos para doar.' },
        { titulo: textos.pergunta, texto: 'É assim que as pessoas vão ver o seu pedido. Se quiser mudar algo, toque em “Alterar”.' },
    ];
    const ultimaEtapa = nomesEtapas.length - 1;

    const [formulario, setFormulario] = useState(inicial);
    const [etapa, setEtapa] = useState(0);
    const [etapaMaxima, setEtapaMaxima] = useState(modo === 'edicao' ? ultimaEtapa : 0);
    const [erros, setErros] = useState<Erros>({});
    const [aviso, setAviso] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const tituloEtapa = useRef<HTMLHeadingElement>(null);
    const { categorias, carregando: carregandoCategorias, erro: erroCategorias } = useCategorias();

    const nomeCategoria = categorias.find((categoria) => categoria.id === formulario.categoriaId)?.nome;

    function alterar<C extends CampoFormulario>(campo: C, valor: Formulario[C]) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }

    /** Troca de etapa e leva o foco ao título dela, para quem usa teclado ou leitor de tela saber onde está. */
    function irPara(nova: number, novoAviso: string | null = null) {
        setEtapa(nova);
        setEtapaMaxima((maxima) => Math.max(maxima, nova));
        setAviso(novoAviso);
        requestAnimationFrame(() => tituloEtapa.current?.focus());
    }

    function mostrarErros(novosErros: Erros, mensagem = AVISO_ERROS) {
        setErros(novosErros);
        irPara(etapaDoPrimeiroErro(novosErros, etapa), mensagem);
    }

    async function enviar(evento: FormEvent) {
        evento.preventDefault();

        if (etapa < ultimaEtapa) {
            const errosEtapa = errosDaEtapa(validar(formulario), etapa);
            if (temErros(errosEtapa)) mostrarErros(errosEtapa);
            else irPara(etapa + 1);
            return;
        }

        const todosErros = validar(formulario);
        if (temErros(todosErros)) {
            mostrarErros(todosErros);
            return;
        }

        setEnviando(true);
        setAviso(null);
        try {
            await aoEnviar(paraRequisicao(formulario), formulario.foto);
        } catch (e) {
            const doServidor = e instanceof ApiError ? errosDaApi(e.campos) : {};
            if (temErros(doServidor)) mostrarErros(doServidor, (e as ApiError).message);
            else setAviso(e instanceof ApiError ? e.message : 'Não foi possível enviar. Tente de novo em instantes.');
        } finally {
            setEnviando(false);
        }
    }

    const lateral = etapa < ultimaEtapa && (
        <>
            <section aria-label='Pré-visualização do pedido' className='flex flex-col gap-3'>
                <h2 className='text-subtitle'>Pré-visualização do pedido</h2>
                <SolicitacaoCard
                    titulo={formulario.titulo}
                    descricao={formulario.descricao}
                    nomeCategoria={nomeCategoria}
                    urgencia={formulario.urgencia}
                    localizacao={{ bairro: formulario.bairro, cidade: formulario.cidade }}
                    fotoUrl={formulario.foto?.url}
                />
            </section>
            <InfoBanner title='Sua privacidade' icon={<ShieldCheck size={18} />}>
                Seu nome, telefone e e-mail não aparecem no pedido. A conversa acontece só pelo Doapp.
            </InfoBanner>
        </>
    );

    const cartao = (
        <form noValidate onSubmit={enviar} className='flex flex-col gap-8 rounded-2xl border border-border/15 bg-surface p-5 md:p-8'>
            <header className='flex flex-col gap-2'>
                <p className='text-caption text-muted'>Etapa {etapa + 1} de {nomesEtapas.length}</p>
                <h2 ref={tituloEtapa} tabIndex={-1} className='text-title-3 leading-tight outline-none'>
                    {cabecalhos[etapa].titulo}
                </h2>
                <p className='text-body leading-snug text-muted'>{cabecalhos[etapa].texto}</p>
            </header>

            {etapa === 0 && <EtapaOQuePrecisa formulario={formulario} erros={erros} alterar={alterar} />}
            {etapa === 1 && (
                <EtapaCategoriaUrgencia
                    formulario={formulario}
                    erros={erros}
                    alterar={alterar}
                    categorias={categorias}
                    carregandoCategorias={carregandoCategorias}
                    erroCategorias={erroCategorias}
                />
            )}
            {etapa === ultimaEtapa && (
                <EtapaRevisar formulario={formulario} nomeCategoria={nomeCategoria} irPara={(nova) => irPara(nova)} />
            )}

            {aviso && (
                <p role='alert' className='flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-body leading-snug text-danger'>
                    <CircleAlert size={18} className='mt-0.5 shrink-0' aria-hidden />
                    {aviso}
                </p>
            )}

            <footer className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
                {etapa > 0 && (
                    <Button variant='outline' onClick={() => irPara(etapa - 1)} disabled={enviando}>Voltar</Button>
                )}
                <Button type='submit' loading={enviando}>
                    {etapa < ultimaEtapa ? 'Continuar' : textos.enviar}
                </Button>
            </footer>
        </form>
    );

    return (
        <div className='mx-auto flex max-w-6xl flex-col gap-8 py-8'>
            <PageHeader
                title={textos.titulo}
                backTo={saidaPara}
                actions={<Link to={saidaPara} className={buttonClasses('link')}>Cancelar</Link>}
            />
            <ProgressStepper
                steps={nomesEtapas}
                currentStep={etapa + 1}
                maxStep={etapaMaxima + 1}
                onStepClick={(passo) => irPara(passo - 1)}
            />
            {lateral ? (
                <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                    <div className='min-w-0'>{cartao}</div>
                    <div className='flex flex-col gap-6 lg:sticky lg:top-6'>{lateral}</div>
                </div>
            ) : (
                <div className='mx-auto w-full max-w-3xl'>{cartao}</div>
            )}
        </div>
    );
}

export default FormularioSolicitacao;
