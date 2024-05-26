import { Categoria } from "../galeria/categoria";
import { Formato } from "./formato";


export class Articulo{
    id: number;
    titulo: string;
    descripcion: string;
    stock: number;
    precio: number;
    categorias: Categoria[];
    formatos: Formato[];
    imagen: string;
}