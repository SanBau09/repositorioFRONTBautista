import { Usuario } from "../usuarios/usuario";
import { Articulo } from "./articulo";


export class Venta{
    id: number;
    usuario : Usuario;
    precioTotal: number;
    fechaVenta: Date;
    articulos : Articulo[];
}