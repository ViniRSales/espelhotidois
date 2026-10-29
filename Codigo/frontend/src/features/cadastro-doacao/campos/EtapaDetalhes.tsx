import { CalendarClock } from 'lucide-react';

import FieldGroup from '@/components/Field/FieldGroup';
import InfoBanner from '@/components/InfoBanner';
import OptionCard from '@/components/OptionCard';
import { DOACAO } from '@/config/doacao';
import { CONDICOES, FORMAS_ENTREGA, type FormaEntrega } from '@/types/doacao';
import { formatarData, somarDias } from '@/utils/datas';

import { useCadastroDoacao } from '../useCadastroDoacao';

/** Etapa 3: condição do item, formas de entrega e o prazo de disponibilidade. */
function EtapaDetalhes() {
    const { estado, alterar } = useCadastroDoacao();
    const { formulario, erros } = estado;

    function alternarEntrega(forma: FormaEntrega, marcada: boolean) {
        const outras = formulario.formasEntrega.filter((f) => f !== forma);
        alterar({ formasEntrega: marcada ? [...outras, forma] : outras });
    }

    return (
        <div className='flex flex-col gap-8'>
            <FieldGroup legend='Condição' error={erros.condicao} className='grid gap-3 sm:grid-cols-2'>
                {CONDICOES.map((opcao) => (
                    <OptionCard
                        key={opcao.valor}
                        type='radio'
                        name='condicao'
                        value={opcao.valor}
                        title={opcao.rotulo}
                        description={opcao.descricao}
                        checked={formulario.condicao === opcao.valor}
                        onChange={() => alterar({ condicao: opcao.valor })}
                    />
                ))}
            </FieldGroup>

            <FieldGroup
                legend='Tipo de entrega'
                hint='Você pode escolher mais de uma opção.'
                error={erros.formasEntrega}
                className='grid gap-3 sm:grid-cols-2'
            >
                {FORMAS_ENTREGA.map((opcao) => (
                    <OptionCard
                        key={opcao.valor}
                        type='checkbox'
                        name='formasEntrega'
                        value={opcao.valor}
                        title={opcao.rotulo}
                        description={opcao.descricao}
                        checked={formulario.formasEntrega.includes(opcao.valor)}
                        onChange={(marcada) => alternarEntrega(opcao.valor, marcada)}
                    />
                ))}
            </FieldGroup>

            <section aria-labelledby='disponibilidade' className='flex flex-col gap-3'>
                <h3 id='disponibilidade' className='text-subtitle'>Disponibilidade</h3>
                <InfoBanner
                    icon={<CalendarClock size={18} />}
                    title={`Disponível por ${DOACAO.diasDisponivel} dias — até ${formatarData(somarDias(new Date(), DOACAO.diasDisponivel))}`}
                >
                    O prazo é definido pela plataforma e conta a partir da publicação. Depois dele, o anúncio é desativado automaticamente.
                </InfoBanner>
            </section>
        </div>
    );
}

export default EtapaDetalhes;
