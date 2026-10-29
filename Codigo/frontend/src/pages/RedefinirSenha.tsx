import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import PasswordField from '@/components/Field/PasswordField';
import InfoBanner from '@/components/InfoBanner';
import CartaoAutenticacao from '@/features/autenticacao/CartaoAutenticacao';
import ErroGeral from '@/features/autenticacao/ErroGeral';
import PerguntaComLink from '@/features/autenticacao/PerguntaComLink';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';
import { erroDaSenha, LIMITES } from '@/features/autenticacao/validacao';
import { useFocoNoErro } from '@/hooks/useFocoNoErro';
import { ApiError } from '@/services/api';
import { redefinirSenha } from '@/services/autenticacao';

export type EstadoSenhaAlterada = { senhaAlterada: true };

const LINK_INVALIDO = 'Este link não vale mais. Peça um novo.';

/**
 * Cria a senha nova com o token do link enviado por e-mail (`?token=`). Abre logado ou não:
 * a API encerra todas as sessões da conta, então quem estava logado neste aparelho também sai.
 */
function RedefinirSenha() {
    const [parametros] = useSearchParams();
    const token = parametros.get('token') ?? '';
    const navigate = useNavigate();
    const { situacao, sair } = useAutenticacao();
    const { formularioRef, focarErro } = useFocoNoErro();

    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | undefined>();
    const [erroGeral, setErroGeral] = useState<string | null>(token ? null : LINK_INVALIDO);
    const [enviando, setEnviando] = useState(false);

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErroGeral(null);
        const erroSenha = erroDaSenha(senha);
        setErro(erroSenha);
        if (erroSenha) {
            focarErro();
            return;
        }

        setEnviando(true);
        try {
            await redefinirSenha(token, senha);
            // O token deste aparelho deixou de valer; encerra a sessão local antes de ir para o login.
            if (situacao === 'logado') await sair();
            const estado: EstadoSenhaAlterada = { senhaAlterada: true };
            navigate('/entrar', { replace: true, state: estado });
        } catch (e) {
            if (e instanceof ApiError && e.erroDoCampo('token')) {
                // Link vencido, já usado ou inventado: a API devolve o erro no campo "token".
                setErroGeral(LINK_INVALIDO);
            } else if (e instanceof ApiError && e.erroDoCampo('senha')) {
                setErro(e.erroDoCampo('senha'));
            } else {
                setErroGeral(e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo em instantes.');
            }
            setEnviando(false);
            focarErro();
        }
    }

    const linkInvalido = erroGeral === LINK_INVALIDO;

    return (
        <CartaoAutenticacao
            titulo='Crie uma senha nova'
            descricao='Escolha uma senha que você não usa em outros sites.'
        >
            <form ref={formularioRef} noValidate onSubmit={enviar} className='flex flex-col gap-5'>
                {erroGeral && <ErroGeral mensagem={erroGeral} />}
                {linkInvalido && (
                    <Link to='/esqueci-senha' className={buttonClasses('outline', 'w-full')}>Pedir um novo link</Link>
                )}
                {!linkInvalido && (
                    <>
                        <PasswordField
                            label='Nova senha'
                            name='senha'
                            autoComplete='new-password'
                            placeholder='Crie uma senha'
                            hint='Use pelo menos 8 caracteres.'
                            maxLength={LIMITES.senha.maximo}
                            value={senha}
                            onChange={(evento) => {
                                setSenha(evento.target.value);
                                setErro(undefined);
                            }}
                            error={erro}
                            required
                        />
                        <InfoBanner title='Por segurança' icon={<ShieldCheck size={18} />}>
                            Ao salvar, você sai da conta em todos os aparelhos e entra de novo com a senha nova.
                        </InfoBanner>
                        <Button type='submit' loading={enviando} className='w-full'>
                            {enviando ? 'Salvando…' : 'Salvar senha nova'}
                        </Button>
                    </>
                )}
            </form>
            <PerguntaComLink pergunta='Lembrou a senha?' para='/entrar'>Entrar</PerguntaComLink>
        </CartaoAutenticacao>
    );
}

export default RedefinirSenha;
