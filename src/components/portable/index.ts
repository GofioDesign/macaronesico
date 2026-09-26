import Cifra from './Cifra.astro';
import Cita from './Cita.astro';
import Destacado from './Destacado.astro';
import Explorador from './Explorador.astro';
import Fuentes from './Fuentes.astro';
import Grafico from './Grafico.astro';
import NotaMetodologica from './NotaMetodologica.astro';
import PasoAPaso from './PasoAPaso.astro';
import Pieza from './Pieza.astro';
import TablaDatos from './TablaDatos.astro';

/**
 * Versión "portátil" de cada bloque: HTML limpio, sin clases ni scripts,
 * para el RSS y para republicar en WordPress.
 */
export const bloquesPortables = { Cifra, Cita, Destacado, Explorador, Fuentes, Grafico, NotaMetodologica, PasoAPaso, Pieza, TablaDatos };
