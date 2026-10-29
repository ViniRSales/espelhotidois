import { MailCheck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import Button from '@/components/Button/Button';
import TextField from '@/components/Field/TextField';
import InfoBanner from '@/components/InfoBanner';
import CartaoAutenticacao from '@/features/autenticacao/CartaoAutenticacao';
import ErroGeral from '@/features/autenticacao/ErroGeral';
import PerguntaComLink from '@/features/autenticacao/PerguntaComLink';
import { emailValido } from '@/features/autenticacao/validacao';
import { useFocoNoErro } from '@/hooks/useFocoNoErro';
import { ApiError } from '@/services/api';
import { pedirRedefinicao } from '@/services/autenticacao';

const ESPERA_REENVIO_SEGUNDOS = 60;

function EsqueciSenha() {
    const { formularioRef, focarErro } = useFocoNoErro();
    const tituloEnviadoRef = useRef<HTMLHeadingElement>(null);
    const [email, setEmail] = useState('');
    const [erro, setErro] = useState<string | undefined>();
    const [erroGeral, setErroGeral] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
    const [espera, setEspera] = useState(0);

    useEffect(() => {
        if (espera <= 0) return;
        const timer = setTimeout(() => setEspera((atual) => atual - 1), 1000);
        return () => clearTimeout(timer);
    }, [espera]);

    useEffect(() => {
        if (enviadoPara) tituloEnviadoRef.current?.focus();
    }, [enviadoPara]);

    async function enviar(destino: string) {
        setErroGeral(null);
        setEnviando(true);
        try {
            await pedirRedefinicao(destino);
            setEnviadoPara(destino);
            setEspera(ESPERA_REENVIO_SEGUNDOS);
        } catch (e) {
            if (e instanceof ApiError && e.erroDoCampo('email')) {
                setErro(e.erroDoCampo('email'));
            } else {
                setErroGeral(e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo em instantes.');
            }
            focarErro();
        } finally {
            setEnviando(false);
        }
    }

    function aoEnviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!emailValido(email)) {
            setErro(email.trim() ? 'Informe um e-mail válido, como nome@email.com.' : 'Informe seu e-mail.');
            focarErro();
            return;
        }
        void enviar(email.trim());
    }

    if (enviadoPara) {
        return (
            <CartaoAutenticacao
                titulo='Confira seu e-mail'
                tituloRef={tituloEnviadoRef}
                descricao={
                    <>
                        Se existir uma conta com <strong className='break-all text-foreground'>{enviadoPara}</strong>, você vai
                        receber um link em alguns minutos.
                    </>
                }
            >
                <InfoBanner title='O link vale por 30 minutos' icon={<MailCheck size={18} />}>
                    Não encontrou? Olhe a caixa de spam ou peça um novo link.
                </InfoBanner>
                {erroGeral && <ErroGeral mensagem={erroGeral} />}
                <div className='flex flex-col gap-1.5'>
                    <Button
                        variant='secondary'
                        className='w-full'
                        loading={enviando}
                        disabled={espera > 0}
                        aria-describedby={espera > 0 ? 'espera-reenvio' : undefined}
                        onClick={() => void enviar(enviadoPara)}
                    >
                        Enviar de novo
                    </Button>
                    {espera > 0 && (
                        <p id='espera-reenvio' className='text-center text-caption text-muted'>
                            Você pode pedir outro link em {espera} s.
                        </p>
                    )}
                </div>
                <PerguntaComLink pergunta='Lembrou a senha?' para='/entrar'>Entrar</PerguntaComLink>
            </CartaoAutenticacao>
        );
    }

    return (
        <CartaoAutenticacao
            titulo='Recuperar senha'
            descricao='Informe o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.'
        >
            <form ref={formularioRef} noValidate onSubmit={aoEnviar} className='flex flex-col gap-5'>
                {erroGeral && <ErroGeral mensagem={erroGeral} />}
                <TextField
                    label='E-mail'
                    type='email'
                    name='email'
                    autoComplete='email'
                    inputMode='email'
                    placeholder='seunome@email.com'
                    value={email}
                    onChange={(evento) => {
                        setEmail(evento.target.value);
                        setErro(undefined);
                    }}
                    error={erro}
                    required
                />
                <Button type='submit' loading={enviando} className='w-full'>
                    {enviando ? 'Enviando…' : 'Enviar link'}
                </Button>
            </form>
            <PerguntaComLink pergunta='Lembrou a senha?' para='/entrar'>Entrar</PerguntaComLink>
        </CartaoAutenticacao>
    );
}

export default EsqueciSenha;
