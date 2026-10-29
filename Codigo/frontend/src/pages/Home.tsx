import { Link } from 'react-router';

import ConviteVisitante from '@/features/autenticacao/ConviteVisitante';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';
import { useCategorias } from '@/hooks/useCategorias';

// Página inicial provisória da base técnica (#10): confirma que o front-end conversa com a API.
// O layout definitivo e a Home entram com a issue #15. O banner ocupa a largura toda da janela e, para
// visitantes, o convite para entrar fica à direita, em cima de um pedaço do cabeçalho, do banner e do resto da
// página (como no wireframe "Início / Sem Login" e na página inicial do Goodreads).
function Home() {
    const { categorias, carregando, erro } = useCategorias();
    const { situacao } = useAutenticacao();

    return (
        <div className="space-y-4">
            {/* -mt-5 encosta o banner no cabeçalho, desfazendo o respiro de cima do <main>. */}
            <div className="relative largura-total -mt-5">
                {/* Espaço do carrossel de destaques (#15). */}
                <div aria-hidden className="h-48 bg-border/10 md:h-75" />
                {situacao === 'visitante' && (
                    // No desktop, o cartão sobe 44 px sobre o cabeçalho e, com 388 px de altura, desce 44 px abaixo
                    // do banner de 300 px. Abaixo de 1024 px, fica logo depois do banner.
                    <div className="container-pagina pt-6 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:-top-11 lg:pt-0">
                        <div className="lg:pointer-events-auto lg:relative lg:z-40 lg:ml-auto lg:flex lg:min-h-97 lg:w-75">
                            <ConviteVisitante />
                        </div>
                    </div>
                )}
            </div>
            <p className="pt-4 text-2xl font-bold">Bem-vindos ao Doapp!</p>
            <section className="mt-8" aria-labelledby="titulo-categorias">
                <h2 id="titulo-categorias" className="text-xl font-semibold">
                    Categorias
                </h2>

                {carregando && <p className="mt-4 text-gray-700">Carregando categorias…</p>}

                {erro && (
                    <p className="mt-4 rounded-lg bg-red-50 p-4 text-red-800" role="alert">
                        {erro}
                    </p>
                )}

                {!carregando && !erro && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {categorias.map((categoria) => (
                            <li key={categoria.id} className="rounded-full bg-gray-100 px-4 py-2">
                                {categoria.nome}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <Link
                to="/theme"
                className="inline-block rounded-full bg-accent px-6 py-3 text-button text-accent-foreground"
            >
                Ver tema
            </Link>
        </div>
    );
}

export default Home;
