import 'leaflet/dist/leaflet.css';

import { useEffect } from 'react';
import { Circle, MapContainer, TileLayer, useMap } from 'react-leaflet';

import type { Coordenadas } from '@/services/localizacao';
import { useTheme } from '@/theme/useTheme';

interface MapaAproximadoProps {
    centro: Coordenadas;
    bairro: string;
}

/** Raio do círculo: grande o bastante para nunca apontar uma casa. */
const RAIO_METROS = 900;
const ZOOM = 14;

/** O MapContainer só usa o centro inicial; este filho acompanha as mudanças. */
function Centralizar({ centro }: { centro: Coordenadas }) {
    const mapa = useMap();
    useEffect(() => {
        mapa.setView([centro.lat, centro.lon], ZOOM);
    }, [mapa, centro.lat, centro.lon]);
    return null;
}

/** Mapa do OpenStreetMap com uma área aproximada em volta do bairro, sem marcador exato. */
function MapaAproximado({ centro, bairro }: MapaAproximadoProps) {
    const { tokens } = useTheme();

    return (
        <div className='overflow-hidden rounded-xl border border-border/15' role='img' aria-label={`Mapa com a área aproximada do bairro ${bairro}`}>
            <MapContainer
                center={[centro.lat, centro.lon]}
                zoom={ZOOM}
                scrollWheelZoom={false}
                className='h-56 w-full'
            >
                <TileLayer
                    url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Circle
                    center={[centro.lat, centro.lon]}
                    radius={RAIO_METROS}
                    pathOptions={{ color: tokens.accent, fillColor: tokens.accent, fillOpacity: 0.2, weight: 2 }}
                />
                <Centralizar centro={centro} />
            </MapContainer>
        </div>
    );
}

export default MapaAproximado;
