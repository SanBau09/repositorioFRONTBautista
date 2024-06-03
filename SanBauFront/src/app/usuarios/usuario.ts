import { Pais } from "./pais";

export class Usuario {
    id: number;
    username: string;
    password: string;
    nombre: string;
    apellidos: string;
    email: string;

    telefono: string;
    localidad: string;
    provincia: string;
    direccion: string;
    cp: string;
    
    roles: string[] = [];

    pais: Pais;
}
