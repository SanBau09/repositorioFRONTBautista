import { Component, OnInit } from '@angular/core';
import {UsuariosService} from '../usuarios.service';
import { Usuario } from '../usuario';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Pais } from '../pais';

@Component({
  selector: 'app-form-registro',
  templateUrl: './form-registro.component.html',
  styleUrls: ['./form-registro.component.css']
})
export class FormRegistroComponent implements OnInit  {
  public usuario: Usuario = new Usuario();
  paises: Pais[];

  public errores: string[];



  constructor(private usuariosService: UsuariosService, private router: Router){}

  ngOnInit(){
    this.usuariosService.getPaises().subscribe(
      paises => this.paises = paises);
  
  }

  
  public create(): void{
    this.usuariosService.create(this.usuario).subscribe({
      next:
      usuario => {
          this.router.navigate(['/login'])
          swal('Nuevo usuario', `El usuario ${usuario.username} ha sido creado con éxito`, 'success');},
        error:
          err => {
            let errorMessage = 'Error al crear el usuario: \n' + err.error.mensaje;
            swal('Error al crear usuario', errorMessage, 'error');
            console.error('Código del error desde el backend: ' + err.status);}
    });
  }

  compararPais(o1: Pais, o2:Pais): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }
}
