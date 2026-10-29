import { LoaderCircle, LocateFixed } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import ChipGroup from '@/components/ChipGroup';
import LocationField from '@/components/Field/LocationField';
import PasswordField from '@/components/Field/PasswordField';
import TextField from '@/components/Field/TextField';
import CartaoAutenticacao from '@/features/autenticacao/CartaoAutenticacao';
import ErroGeral from '@/features/autenticacao/ErroGeral';
import PerguntaComLink from '@/features/autenticacao/PerguntaComLink';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';
import {
    errosDaApi,
    formatarTelefone,
    LIMITES,
    soDigitos,
    temErros,
    validarCadastro,
    type Erros,
    type FormularioCadastro,
} from '@/features/autenticacao/validacao';
import { useFocoNoErro } from '@/hooks/useFocoNoErro';
import { useLocalizacaoAtual } from '@/hooks/useLocalizacaoAtual';
import { ApiError } from '@/services/api';
import { TIPOS_CONTA, type TipoConta } from '@/types/autenticacao';

const VAZIO: FormularioCadastro = {
    tipo: 'PESSOA_FISICA', nome: '', email: '', telefone: '', local: null, senha: '',
};

function CriarConta() {
    const { cadastrar } = useAutenticacao();
    const location = useLocation();
    const { formularioRef, focarErro } = useFocoNoErro();

    const [formulario, setFormulario] = useState<FormularioCadastro>(VAZIO);
    const [erros, setErros] = useState<Erros<FormularioCadastro>>({});
    const [erroGeral, setErroGeral] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const ehInstituicao = formulario.tipo === 'INSTITUICAO';
    const localizacaoAtual = useLocalizacaoAtual();

    async function usarLocalizacaoAtual() {
        const local = await localizacaoAtual.localizar();
        if (local) alterar('local', local);
    }

    function alterar<C extends keyof FormularioCadastro>(campo: C, valor: FormularioCadastro[C]) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErroGeral(null);
        const novosErros = validarCadastro(formulario);
        setErros(novosErros);
        if (temErros(novosErros)) {
            focarErro();
            return;
        }

        setEnviando(true);
        try {
            await cadastrar({
                tipo: formulario.tipo,
                nome: formulario.nome.trim(),
                email: formulario.email.trim(),
                telefone: soDigitos(formulario.telefone),
                bairro: formulario.local!.bairro,
                cidade: formulario.local!.cidade,
                uf: formulario.local!.uf,
                senha: formulario.senha,
            });
        } catch (erro) {
            if (erro instanceof ApiError && erro.status === 409) {
                setErros({ email: erro.message });
            } else if (erro instanceof ApiError && erro.campos.length > 0) {
                setErros(errosDaApi<FormularioCadastro>(erro));
            } else {
                setErroGeral(erro instanceof ApiError ? erro.message : 'Algo deu errado. Tente de novo em instantes.');
            }
            setEnviando(false);
            focarErro();
        }
    }

    return (
        <CartaoAutenticacao titulo='Criar conta'>
            <form ref={formularioRef} noValidate onSubmit={enviar} className='flex flex-col gap-5'>
                {erroGeral && <ErroGeral mensagem={erroGeral} />}

                <ChipGroup
                    legend='Você é'
                    name='tipo'
                    options={TIPOS_CONTA}
                    value={formulario.tipo}
                    onChange={(valor) => alterar('tipo', valor as TipoConta)}
                    error={erros.tipo}
                />
                <TextField
                    label={ehInstituicao ? 'Nome da instituição' : 'Nome completo'}
                    name='nome'
                    autoComplete={ehInstituicao ? 'organization' : 'name'}
                    maxLength={LIMITES.nome.maximo}
                    value={formulario.nome}
                    onChange={(evento) => alterar('nome', evento.target.value)}
                    error={erros.nome}
                    required
                />
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
                <TextField
                    label='Telefone'
                    type='tel'
                    name='telefone'
                    autoComplete='tel-national'
                    inputMode='tel'
                    placeholder='(31) 99999-9999'
                    value={formulario.telefone}
                    onChange={(evento) => alterar('telefone', formatarTelefone(evento.target.value))}
                    error={erros.telefone}
                    required
                />
                <PasswordField
                    label='Senha'
                    name='senha'
                    autoComplete='new-password'
                    placeholder='Crie uma senha'
                    hint='Use pelo menos 8 caracteres.'
                    maxLength={LIMITES.senha.maximo}
                    value={formulario.senha}
                    onChange={(evento) => alterar('senha', evento.target.value)}
                    error={erros.senha}
                    required
                />
                <LocationField
                    label='Bairro'
                    placeholder='Ex.: Savassi, Belo Horizonte'
                    hint='Digite e escolha seu bairro na lista.'
                    value={formulario.local}
                    onChange={(local) => alterar('local', local)}
                    error={erros.local ?? (formulario.local ? undefined : localizacaoAtual.mensagem ?? undefined)}
                    action={
                        <button
                            type='button'
                            onClick={usarLocalizacaoAtual}
                            disabled={localizacaoAtual.buscando}
                            className={buttonClasses('link', 'gap-1.5 text-link')}
                        >
                            {localizacaoAtual.buscando
                                ? <LoaderCircle size={16} className='animate-spin' aria-hidden />
                                : <LocateFixed size={16} aria-hidden />}
                            {localizacaoAtual.buscando ? 'Localizando…' : 'Usar minha localização'}
                        </button>
                    }
                />

                <div className='flex flex-col gap-3'>
                    <Button type='submit' loading={enviando} className='w-full'>
                        {enviando ? 'Criando conta…' : 'Criar conta'}
                    </Button>
                    <p className='text-center text-caption leading-snug text-muted'>
                        E-mail e telefone não aparecem para ninguém. Nos anúncios mostramos só o seu bairro.
                    </p>
                </div>
            </form>

            <PerguntaComLink pergunta='Já tem conta?' para='/entrar' state={location.state}>Entrar</PerguntaComLink>
        </CartaoAutenticacao>
    );
}

export default CriarConta;
