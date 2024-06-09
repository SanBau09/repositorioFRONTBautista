import { Articulo } from "./articulo";
import { Formato } from "./formato";


export class ItemCompra{
    id: number;
    articulo: Articulo;
    formato: Formato;
    cantidad: number;
}