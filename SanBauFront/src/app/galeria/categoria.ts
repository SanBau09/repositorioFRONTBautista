import { Ilustracion } from "./ilustracion";


export class Categoria{
    id: number;
    nombre: string;
    esGaleria: boolean;
    ilustraciones: Ilustracion[]
}