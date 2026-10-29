import { CircleCheck, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import Checkbox from '@/components/Checkbox';
import PasswordField from '@/components/Field/PasswordField';
import TextField from '@/components/Field/TextField';
import InfoBanner from '@/components/InfoBanner';
import CartaoAutenticacao from '@/features/autenticacao/CartaoAutenticacao';
import Divisor from '@/features/autenticacao/Divisor';
import { destinoAposLogin } from '@/features/autenticacao/destino';
import ErroGeral from '@/features/autenticacao/ErroGeral';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';
import { errosDaApi, temErros, validarLogin, type Erros, type FormularioLogin } from '@/features/autenticacao/validacao';
import { useFocoNoErro } from '@/hooks/useFocoNoErro';
import { ApiError } from '@/services/api';

import type { EstadoSenhaAlterada } from './RedefinirSenha';

function Entrar() {
    const { entrar } = useAutenticacao();
    const location = useLocation();
    const veioDeTelaProtegida = destinoAposLogin(location.state) !== '/';
    const senhaAlterada = (location.state as Partial<EstadoSenhaAlterada> | null)?.senhaAlterada === true;
    const { formularioRef, focarErro } = useFocoNoErro();

    const [formulario, setFormulario] = useState<FormularioLogin>({ email: '', senha: '', manterConectado: true });
    const [erros, setErros] = useState<Erros<FormularioLogin>>({});
    const [erroGeral, setErroGeral] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    function alterar<C extends keyof FormularioLogin>(campo: C, valor: FormularioLogin[C]) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErroGeral(null);
        const novosErros = validarLogin(formulario);
        setErros(novosErros);
        if (temErros(novosErros)) {
            focarErro();
            return;
        }

        setEnviando(true);
        try {
            await entrar({ ...formulario, email: formulario.email.trim() });
        } catch (erro) {
            if (erro instanceof ApiError && erro.campos.length > 0) {
                setErros(errosDaApi<FormularioLogin>(erro));
            } else {
                setErroGeral(erro instanceof ApiError ? erro.message : 'Algo deu errado. Tente de novo em instantes.');
            }
            setEnviando(false);
            focarErro();
        }
    }

    return (
        <CartaoAutenticacao titulo='Entrar'>
            {senhaAlterada && (
                <div role='status'>
                    <InfoBanner title='Senha alterada' icon={<CircleCheck size={18} />}>
                        Pronto! Agora entre com a senha nova.
                    </InfoBanner>
                </div>
            )}
            {veioDeTelaProtegida && (
                <InfoBanner icon={<LogIn size={18} />}>Entre na sua conta para continuar.</InfoBanner>
            )}

            <form ref={formularioRef} noValidate onSubmit={enviar} className='flex flex-col gap-5'>
                {erroGeral && <ErroGeral mensagem={erroGeral} />}

                <TextField
                    label='E-mail'
                    type='email'
                    name='email'
                    autoComplete='email'
                    inputMode='email'
                    placeholder='seunome@email.com'
                    value={formulario.email}
                    onChange={(evento) => alterar('email', evento.target.value)}
                    error={erros.email}
                    required
                />
                <PasswordField
                    label='Senha'
                    name='senha'
                    action={<Link to='/esqueci-senha' className={buttonClasses('link')}>Esqueci minha senha</Link>}
                    autoComplete='current-password'
                    placeholder='Digite sua senha'
                    value={formulario.senha}
                    onChange={(evento) => alterar('senha', evento.target.value)}
                    error={erros.senha}
                    required
                />

                <Button type='submit' loading={enviando} className='w-full'>
                    {enviando ? 'Entrando…' : 'Entrar'}
                </Button>
                <Checkbox
                    label='Manter conectado'
                    description='Use só em aparelhos pessoais. Você fica conectado por 7 dias.'
                    checked={formulario.manterConectado}
                    onChange={(evento) => alterar('manterConectado', evento.target.checked)}
                />
            </form>

            <Divisor>Novo no Doapp?</Divisor>
            <Link to='/criar-conta' state={location.state} className={buttonClasses('outline', 'w-full')}>
                Criar conta
            </Link>
        </CartaoAutenticacao>
    );
}

export default Entrar;
