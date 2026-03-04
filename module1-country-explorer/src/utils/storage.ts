//la clave con la que se va guardar favoritos en local storage

//se usa country-explorer: para evitar colisiones con otras apps en el mismo dominio
const FAVORITES_KEY = 'country-explorer:favorites';

//obtiene el array de codigos de paises favoritos
export function getFavorites(): string[] {
    try{
        //lee el valor guardado en el navegador para esa clave 
        //si existe devuelve un string, si no existe devuelve null
        const raw = localStorage.getItem(FAVORITES_KEY);

        //si no hay favoritos retornar array vacio
        if(!raw){
            return[];
        }

        //JSON.parse convierte el string de nuevo array
        const parsed: unknown = JSON.parse(raw)

        //validar que sea un array de string
        if(Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')){
            return parsed;
        }else{
            return [];
        }
    } catch{
        //si algo falla se retorna un array vacio y se limpia el dato corrupto
        localStorage.removeItem(FAVORITES_KEY);
        return[];
    }
}

//fuarda el array completo de favoritos en localstorage
function saveFavorites(favorites: string[]):void{
    try {
        //JSON.stringfly convierte el array a string para guardarlo
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }catch(error){
        console.error('Error al guardar favoritos:', error);
    }
}

//verifica si un pais esta en favoritos
export function isFavorite(cca3:string): boolean{
    return getFavorites().includes(cca3);
}

//agrega un pais a favoritos
export function addFavorite(cca3:string):void{
    //array de favoritos
    const current = getFavorites();
    //solo se agrega si no existe
    //crea un nuevo array combinando los elementos existentes mas el nuevo
    if(!current.includes(cca3)){
        saveFavorites([...current, cca3]);
    }
}

//elimina un pais de favoritos
export function removeFavorite(cca3:string): void{
    const current = getFavorites();
    //filter crea sin el elemento a eliminar
    saveFavorites(current.filter((code)=>code!==cca3));
}

//alterna el estado de favorito de un pais, si era favorito lo elimina si no era lo agrega
export function toggleFavorite(cca3:string):boolean{
    if(isFavorite(cca3)){
        removeFavorite(cca3);
        return false;
    }else{
        addFavorite(cca3);
        return true;
    }
}

//elimina todos los favoritos
export function clearAllFavorites():void{
    localStorage.removeItem(FAVORITES_KEY);
}