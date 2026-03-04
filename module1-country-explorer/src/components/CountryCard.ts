// =============================================================================
// COMPONENTE: TARJETA DE PAÍS - Country Explorer
// =============================================================================
// Este módulo define cómo se renderiza cada país en la lista de resultados.
//
// ## ¿Qué es un "componente" sin framework?
// Sin React/Vue, un componente es simplemente una función que:
// 1. Recibe datos (props)
// 2. Devuelve un elemento del DOM
// 3. Puede encapsular lógica de eventos
//
// Este patrón se llama "Factory Function" o "Component Factory".
// =============================================================================

import type { Country } from '../types/country';
import { formatNumber, formatCapitals } from '../utils/format';
import { createElement } from '../utils/dom';
import { eventNames } from 'process';
import { count } from 'console';

/**
 * Crea una tarjeta de país para mostrar en la lista.
 *
 * ## Renderizado imperativo vs declarativo
 * En frameworks como React, describimos QUÉ queremos renderizar (declarativo):
 * ```jsx
 * return <div className="card">{country.name}</div>;
 * ```
 *
 * Sin framework, describimos CÓMO crear los elementos (imperativo):
 * ```ts
 * const div = document.createElement('div');
 * div.className = 'card';
 * div.textContent = country.name;
 * ```
 *
 * Ambos enfoques son válidos, pero el declarativo escala mejor.
 *
 * @param country - Datos del país a renderizar
 * @param onClick - Callback cuando se hace click en la tarjeta
 * @returns Elemento article con la tarjeta del país
 */
export function createCountryCard(
  country: Country,
  onClick: (country: Country) => void,
  isFavorite: boolean = false, //para saber si es favorito o no
  onFavoriteToggle: (country:Country) => void = () => {} //callback al hacer toggle de favoritos
): HTMLElement {
  // Creamos el contenedor principal usando nuestra utilidad
  const card = createElement('article', 'country-card', 'cursor-pointer');
  //guarda el cca3 en el DOM para identificar la tarjeta
  card.dataset.cca3 = country.cca3;

  // Agregamos atributos de accesibilidad
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Ver detalles de ${country.name.common}`);

  // =========================================================================
  // CONSTRUCCIÓN DEL HTML
  // =========================================================================
  // Usamos template literals para crear el HTML de forma legible.
  // innerHTML es seguro aquí porque controlamos todos los datos.
  // =========================================================================
  card.innerHTML = `
    <div class="relative">
      <!-- Bandera del país -->
      <img
        src="${country.flags.svg}"
        alt="${country.flags.alt ?? `Bandera de ${country.name.common}`}"
        class="w-full h-48 object-cover"
        loading="lazy"
      />
      <!-- Badge de región -->
      <span class="absolute top-3 right-3 px-3 py-1 bg-slate-900/80 text-slate-200 text-xs font-medium rounded-full backdrop-blur-sm">
        ${country.region}
      </span>

      <!-- Boton de favorito -->
      <button
          class="favorite-btn absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
          data-cca3="${country.cca3}"
      >
          ${isFavorite ? HEART_FILLED : HEART_OUTLINE}
      </button>
    </div>

    <div class="p-5">
      <!-- Nombre del país -->
      <h2 class="text-xl font-bold text-white mb-2 truncate">
        ${country.name.common}
      </h2>

      <!-- Nombre oficial (si es diferente) -->
      ${
        country.name.official !== country.name.common
          ? `<p class="text-slate-400 text-sm mb-3 truncate" title="${country.name.official}">
          ${country.name.official}
        </p>`
          : ''
      }

      <!-- Informacion basica -->
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2 text-slate-300">
          <span class="text-slate-500">Capital:</span>
          <span class="truncate">${formatCapitals(country.capital)}</span>
        </div>

        <div class="flex items-center gap-2 text-slate-300">
          <span class="text-slate-500">Poblacion:</span>
          <span>${formatNumber(country.population)}</span>
        </div>

        <div class="flex items-center gap-2 text-slate-300">
          <span class="text-slate-500">Subregion:</span>
          <span class="truncate">${country.subregion ?? country.region}</span>
        </div>
      </div>

      <!-- Indicador de más información -->
      <div class="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
        <span>Ver más detalles</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  `;

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================
  // Agregamos interactividad a la tarjeta. Soportamos tanto click como
  // teclado (Enter/Space) para accesibilidad.
  // =========================================================================

  // Manejador de click
  card.addEventListener('click', () => {
    onClick(country);
  });

  // Manejador de teclado para accesibilidad (Enter o Space activan la tarjeta)
  card.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(country);
    }
  });

  return card;
}


const favoriteButton = card.querySelector<HTMLButtonElement>('.favorite-btn');
// escucha el click del boton favorito sin propagar el evento a la tarjeta
if (favoriteButton){
  favoriteButton.addEventListener('click', (event:MouseEvent)=>{
    //evita que el click se propague y abra el detalle del pais
    event.stopPropagation();
    onFavoriteToggle(country);
  });
}

/**
 * Renderiza una lista de países en un contenedor.
 *
 * @param countries - Array de países a renderizar
 * @param container - Elemento donde insertar las tarjetas
 * @param onCardClick - Callback cuando se hace click en una tarjeta
 */
export function renderCountryList(
  countries: Country[],
  container: HTMLElement,
  onCardClick: (country: Country) => void
): void {
  // Limpiamos el contenedor de forma eficiente
  container.replaceChildren();

  // =========================================================================
  // DOCUMENT FRAGMENT
  // =========================================================================
  // Usamos DocumentFragment para insertar múltiples elementos de una vez.
  // Esto es más eficiente que insertar uno por uno, ya que causa un solo
  // reflow/repaint del navegador.
  // =========================================================================
  const fragment = document.createDocumentFragment();

  for (const country of countries) {
    const card = createCountryCard(country, onCardClick);
    fragment.appendChild(card);
  }

  // Una sola operación DOM para todos los elementos
  container.appendChild(fragment);
}


//actualiza el icono y etiqueta del boton de favoritos de una tarjeta de pais
//Si la tarjeta o el botón no existen en el contenedor no hace nada
export function updateFavoriteButton(
  cca3: string,
  isFavorite: boolean,
  container: HTMLElement
): void {
  const card = container.querySelector<HTMLElement>(`[data-cca3="${cca3}"]`);
  if(!card){
    return;
  }

  const button = card.querySelector<HTMLButtonElement>('.favorite-btn');
  if(!button){
    return;
  }

  button.innerHTML = isFavorite ? HEART_FILLED : HEART_OUTLINE;
  button.setAttribute('aria-label', isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos');
}

const HEART_OUTLINE = `
  <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
`;

const HEART_FILLED = `
  <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
`;
