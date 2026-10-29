import { Link } from 'react-router';

import ConviteVisitante from '@/features/autenticacao/ConviteVisitante';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';
import { useCategorias } from '@/hooks/useCategorias';

// Página inicial provisória da base técnica (#10): confirma que o front-end conversa com a API.
function Home() {
    const { categorias, carregando, erro } = useCategorias();
    const { situacao } = useAutenticacao();

    return (
        <div className="space-y-4">
            <div className="relative largura-total -mt-5">
                <div aria-hidden className="h-48 bg-border/10 md:h-75" />
                {situacao === 'visitante' && (
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
