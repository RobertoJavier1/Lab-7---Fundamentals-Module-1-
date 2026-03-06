// =============================================================================
// PUNTO DE ENTRADA - Country Explorer
// =============================================================================
// Este es el archivo principal de la aplicación. Aquí:
// 1. Inicializamos la aplicación cuando el DOM está listo
// 2. Conectamos los event listeners
// 3. Manejamos el estado de la UI
//
// ## Arquitectura de la aplicación
// Seguimos una arquitectura simple pero organizada:
//
// ```
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                              main.ts                                     │
// │                        (Punto de entrada)                               │
// │                                                                          │
// │  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐    │
// │  │   Eventos    │───>│  Estado de UI    │───>│    Renderizado     │    │
// │  │   (click,    │    │  (UiState)       │    │  (CountryCard,     │    │
// │  │    input)    │    │                  │    │   CountryModal)    │    │
// │  └──────────────┘    └──────────────────┘    └────────────────────┘    │
// │          │                    ▲                        │               │
// │          │                    │                        │               │
// │          ▼                    │                        │               │
// │  ┌──────────────────────────────────────────────────────┐             │
// │  │              countryApi.ts (Servicio)                 │             │
// │  │         (Comunicación con REST Countries)             │             │
// │  └──────────────────────────────────────────────────────┘             │
// └─────────────────────────────────────────────────────────────────────────┘
// ```
// =============================================================================

import type { Country, UiState } from './types/country';
//se importo tambien getCountriesByRegion
import { searchCountries, getCountriesByRegion, getCountriesByCodes, ApiError } from './services/countryApi';
import { renderCountryList, updateFavoriteButton } from './components/CountryCard';
import { openModal } from './components/CountryModal';
import { getRequiredElement, showElement, hideElement, onDOMReady, debounce } from './utils/dom';
import { getFavorites, toggleFavorite, clearAllFavorites } from './utils/storage';


// =============================================================================
// ESTADO DE LA APLICACIÓN
// =============================================================================
// Mantenemos un estado global simple. En aplicaciones más grandes, usaríamos
// un patrón de gestión de estado más sofisticado (Redux, Zustand, etc.).
// =============================================================================

/** Estado actual de la UI */
let currentState: UiState = { status: 'idle' };

/** Última búsqueda realizada (para evitar búsquedas duplicadas) */
let lastSearchQuery = '';

//ultiam region buscada
let lastRegion = '';

//la region actual
let currentRegion = '';

//set con los codigos cca3 de los paises favoritos
//se inicializa obteniendo los favoritos de localStorage
let favoriteCodes: Set<string> = new Set(getFavorites());

//filtro de favoritos
let showOnlyFavorites = false;

// =============================================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// =============================================================================
// Obtenemos referencias a los elementos que vamos a manipular.
// Usamos getRequiredElement porque sabemos que estos elementos existen en el HTML.
// =============================================================================

let searchInput: HTMLInputElement;
let searchButton: HTMLButtonElement;
let retryButton: HTMLButtonElement;
let loadingState: HTMLElement;
let errorState: HTMLElement;
let errorMessage: HTMLElement;
let emptyState: HTMLElement;
let noResultsState: HTMLElement;
let countriesList: HTMLElement;
//dropdown para filtrar paises por region
let regionFilter: HTMLSelectElement

//manipulacion de favoritos
let favoritesBar: HTMLElement;
let favoritesToggle: HTMLInputElement;
let favoritesCount: HTMLElement;
let clearFavoritesBtn: HTMLButtonElement;
let noFavoritesState: HTMLElement

/**
 * Inicializa las referencias a los elementos del DOM.
 * Se llama una vez cuando la aplicación arranca.
 */
function initializeElements(): void {
  searchInput = getRequiredElement<HTMLInputElement>('#searchInput');
  searchButton = getRequiredElement<HTMLButtonElement>('#searchButton');
  retryButton = getRequiredElement<HTMLButtonElement>('#retryButton');
  loadingState = getRequiredElement<HTMLElement>('#loadingState');
  errorState = getRequiredElement<HTMLElement>('#errorState');
  errorMessage = getRequiredElement<HTMLElement>('#errorMessage');
  emptyState = getRequiredElement<HTMLElement>('#emptyState');
  noResultsState = getRequiredElement<HTMLElement>('#noResultsState');
  countriesList = getRequiredElement<HTMLElement>('#countriesList');
  regionFilter = getRequiredElement<HTMLSelectElement>('#regionFilter');
  favoritesBar = getRequiredElement<HTMLElement>('#favoritesBar');
  favoritesToggle = getRequiredElement<HTMLInputElement>('#favoritesToggle');
  favoritesCount = getRequiredElement<HTMLElement>('#favoritesCount');
  clearFavoritesBtn = getRequiredElement<HTMLButtonElement>('#clearFavoritesBtn');
  noFavoritesState = getRequiredElement<HTMLElement>('#noFavoritesState');
}

// =============================================================================
// FUNCIONES DE RENDERIZADO DE ESTADO
// =============================================================================
// Estas funciones actualizan la UI según el estado actual.
// Seguimos el principio de "fuente única de verdad": el estado determina la UI.
// =============================================================================

/**
 * Oculta todos los estados de la UI.
 * Llamamos esto antes de mostrar un nuevo estado.
 */
function hideAllStates(): void {
  hideElement(loadingState);
  hideElement(errorState);
  hideElement(emptyState);
  hideElement(noResultsState);
  hideElement(noFavoritesState);
  hideElement(countriesList);
}

/**
 * Renderiza la UI según el estado actual.
 *
 * ## Patrón de renderizado basado en estado
 * En lugar de manipular la UI directamente en respuesta a eventos,
 * actualizamos el estado y luego renderizamos basándonos en él.
 * Esto hace el código más predecible y fácil de debuggear.
 *
 * @param state - Nuevo estado de la UI
 */
function render(state: UiState): void {
  currentState = state;

  //si modo favorito esta activo, llamamos a renderFavoriteList() y salimos  
  if(showOnlyFavorites){
    renderFavoriteList();
    return;
  }

  hideAllStates();

  // =========================================================================
  // SWITCH EXHAUSTIVO
  // =========================================================================
  // TypeScript verifica que manejemos todos los casos posibles.
  // Si agregamos un nuevo estado y olvidamos manejarlo, dará error.
  // =========================================================================
  switch (state.status) {
    case 'idle':
      // Estado inicial: mostramos mensaje de bienvenida
      showElement(emptyState);
      break;

    case 'loading':
      // Buscando países: mostramos spinner
      showElement(loadingState);
      break;

    case 'success':
      // Búsqueda exitosa con resultados
      if (state.data.length === 0) {
        showElement(noResultsState);
      } else {
        showElement(countriesList);
        renderCountryList(
          state.data,
          countriesList,
          handleCountryClick,
          favoriteCodes,
          handleFavoriteToogle
        );
      }
      break;

    case 'error':
      // Error en la búsqueda
      showElement(errorState);
      errorMessage.textContent = state.message;
      break;

    case 'empty':
      // Sin resultados para la búsqueda
      showElement(noResultsState);
      break;

    default: {
      // Este bloque nunca debería ejecutarse si manejamos todos los casos
      // TypeScript usa esto para verificación de exhaustividad
      const _exhaustiveCheck: never = state;
      console.error('Estado no manejado:', _exhaustiveCheck);
    }
  }
}


//obtener paises aplicando busqueda y region de forma combinada
async function getFilteredCountries(query: string, region: string): Promise<Country[] | null> {
  const hasQuery = query.length > 0;
  const hasRegion = region.length > 0;

  //sin filtros activos
  if (!hasQuery && !hasRegion) return null;

  //solo filtro de region
  if (hasRegion && !hasQuery) {
    return getCountriesByRegion(region as 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania');
  }

  //solo el texto de busqueda
  if (hasQuery && !hasRegion) {
    return searchCountries(query);
  }

  //ambos activos busca por nombre y filtra por region
  const results = await searchCountries(query);
  return results.filter(c => c.region === region);
}

//actualiza la barra de favoritos segun cuantos favoritos hay
function updateFavoritesBar(): void{
  const count = favoriteCodes.size;
  favoritesCount.textContent = String(count);

  if(count===0){
    showOnlyFavorites = false;
    favoritesToggle.checked = false;
    render(currentState);
  }
}


// =============================================================================
// MANEJADORES DE EVENTOS
// =============================================================================

/**
 * Maneja la búsqueda de países.
 *
 * ## Flujo de la búsqueda:
 * 1. Obtenemos el valor del input
 * 2. Validamos que haya texto
 * 3. Mostramos estado de carga
 * 4. Hacemos la petición a la API
 * 5. Mostramos resultados o error
 */
async function handleSearch(): Promise<void> {
  const query = searchInput.value.trim();
  //guardar la region
  const region = currentRegion;

  // Si la búsqueda está vacía, volvemos al estado inicial
  // el === es una igualdada estricta
  if (query.length === 0 && region.length === 0) {
    render({ status: 'idle' });
    lastSearchQuery = '';
    return;
  }

  // Evitamos búsquedas duplicadas, tambien verifica lastRegion
  if (query === lastSearchQuery && region == lastRegion && currentState.status === 'success') {
    return;
  }

  lastSearchQuery = query;
  lastRegion = region

  // Mostramos estado de carga
  render({ status: 'loading' });

  try {
    // =========================================================================
    // ASYNC/AWAIT Y MANEJO DE ERRORES
    // =========================================================================
    // await pausa la ejecución hasta que la Promise se resuelve.
    // Si la Promise se rechaza, el error se captura en el catch.
    // =========================================================================
    
    // filtrar por busqueda y region
    const countries = await getFilteredCountries(query, region);

    if (!countries || countries.length === 0) {
      render({ status: 'empty' });
    } else {
      render({ status: 'success', data: countries });
    }
  } catch (error) {
    // Determinamos el mensaje de error apropiado
    let message = 'Error desconocido al buscar países';

    if (error instanceof ApiError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    render({ status: 'error', message });

    // Log para debugging (en producción usaríamos un servicio de logging)
    console.error('Error en búsqueda:', error);
  }
}

//maneja el cambio de region en el dropdown, fuerza una nueva busqueda combinando region y texto actual

function handleRegionChange():void{
  currentRegion = regionFilter.value;
  //reinicio de lastSearchQuery para forzar la busqueda de nuevo aunque no cambie el texto
  lastSearchQuery = '';
  void handleSearch();
}

//maneja el evento cuando se clickea el boton de favorito en una tarjeta
function handleFavoriteToogle(country: Country): void{
  const nowFavorite = toggleFavorite(country.cca3);

  if(nowFavorite){
    favoriteCodes.add(country.cca3);
  }else{
    favoriteCodes.delete(country.cca3);
  }

  //actualiza el icono de solo esa tarjeta
  updateFavoriteButton(country.cca3, nowFavorite, countriesList);

  //actualiza el contador y visibilidad de la barra
  updateFavoritesBar();

  //si el filtro favoritos esta activo, re renderiza la lista
  if(showOnlyFavorites){
    renderFavoriteList();
  }
}

//renderiza la lista filtrada mostrando solo los paises favoritos
//si hay filtros activos usa los datos en memoria, si no va a la API
function renderFavoriteList():void {
  hideAllStates();

  if(favoriteCodes.size===0){
    showElement(noFavoritesState);
    return;
  }

  const hasSearch = lastSearchQuery.length > 0;
  const hasRegion = currentRegion.length > 0;

  if(currentState.status === 'success' && (hasSearch || hasRegion)){
    //filtra currentState.data quedandose solo con los paises que su cca3 esta en favoritesCodes
    const favoriteCountries = currentState.data.filter((c) => favoriteCodes.has(c.cca3));

    if(favoriteCountries.length===0){
      showElement(noFavoritesState);
    }else{
      showElement(countriesList);
      renderCountryList(
        favoriteCountries,
        countriesList,
        handleCountryClick,
        favoriteCodes,
        handleFavoriteToogle
      );
    }
  }else if(!hasSearch && !hasRegion){
    //sin filtros
    //no hay busqueda activa buscamos los favoritose en la API
    showElement(loadingState);
    void getCountriesByCodes([...favoriteCodes]).then((countries) => {
      hideElement(loadingState);
      if (countries.length === 0) {
        showElement(noFavoritesState);
      } else {
        showElement(countriesList);
        renderCountryList(
          countries,
          countriesList,
          handleCountryClick,
          favoriteCodes,
          handleFavoriteToogle
        );
      }
  });
  }else{
    showElement(noFavoritesState);
  }
}

/**
 * Maneja el click en una tarjeta de país.
 * Abre el modal con los detalles del país.
 *
 * @param country - País seleccionado
 */
function handleCountryClick(country: Country): void {
  openModal(country);
}

/**
 * Maneja el evento de reintentar después de un error.
 */
function handleRetry(): void {
  handleSearch();
}

// =============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =============================================================================

/**
 * Configura los event listeners de la aplicación.
 *
 * ## Event Listeners
 * Conectamos los elementos del DOM con sus manejadores de eventos.
 * Usamos debounce para el input para evitar demasiadas peticiones.
 */
function setupEventListeners(): void {
  // =========================================================================
  // BÚSQUEDA CON DEBOUNCE
  // =========================================================================
  // El debounce retrasa la ejecución hasta que el usuario deja de escribir.
  // Esto evita hacer una petición por cada tecla presionada.
  // =========================================================================
  const debouncedSearch = debounce(() => {
    void handleSearch();
  }, 400);

  // Input: búsqueda mientras se escribe (con debounce)
  searchInput.addEventListener('input', debouncedSearch);

  // Botón de búsqueda: búsqueda inmediata
  searchButton.addEventListener('click', () => {
    void handleSearch();
  });

  // Enter en el input: búsqueda inmediata
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      void handleSearch();
    }
  });

  //maneja el evento de cuando el usuario marca o desmarca el checkbox de solo favoritos
  favoritesToggle.addEventListener('change',()=>{
    showOnlyFavorites = favoritesToggle.checked;

    if(showOnlyFavorites){
      renderFavoriteList();
    }else{
      render(currentState);
    }
  });

  //boton para limpiar favoritos
  clearFavoritesBtn.addEventListener('click',() => {
    clearAllFavorites();
    favoriteCodes.clear();
    updateFavoritesBar();

    if(showOnlyFavorites){
      renderFavoriteList();
    }else{
      render(currentState);
    }
  });

  // Botón de reintentar
  retryButton.addEventListener('click', handleRetry);

  //dropdown de region: filtra al cambiar la region
  regionFilter.addEventListener('change',handleRegionChange)
}

/**
 * Inicializa la aplicación.
 *
 * ## Punto de entrada principal
 * Esta función se ejecuta cuando el DOM está completamente cargado.
 * Es el equivalente a `onCreate` en Android o `mounted` en Vue.
 */
function initializeApp(): void {
  try {
    // Obtenemos referencias a los elementos del DOM
    initializeElements();

    // Configuramos los event listeners
    setupEventListeners();

    //carga favoritos de localStorage
    updateFavoritesBar()

    // Mostramos el estado inicial
    render({ status: 'idle' });

    // Enfocamos el input de búsqueda para UX
    searchInput.focus();

    console.log('Country Explorer inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
  }
}

// =============================================================================
// ARRANQUE DE LA APLICACIÓN
// =============================================================================
// Usamos onDOMReady para asegurarnos de que el DOM esté listo antes de
// intentar acceder a los elementos.
// =============================================================================

onDOMReady(initializeApp);
