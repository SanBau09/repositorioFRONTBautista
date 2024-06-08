import { Component, OnInit } from '@angular/core';
import {UsuariosService} from '../usuarios.service';
import { Usuario } from '../usuario';
import swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { Pais } from '../pais';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-form-registro',
  templateUrl: './form-registro.component.html',
  styleUrls: ['./form-registro.component.css']
})
export class FormRegistroComponent implements OnInit  {
  public usuario: Usuario = new Usuario();
  paises: Pais[];

  public errores: string[];





  constructor(public authService:AuthService, private usuariosService: UsuariosService, private router: Router, private activatedRoute: ActivatedRoute){}

  ngOnInit(){
    this.cargarUsuario();
    this.usuariosService.getPaises().subscribe( paises => this.paises = paises);
  
  }

 
  cargarUsuario(): void{
    this.activatedRoute.params.subscribe(params => {
      let usuarioActual = this.authService.usuario;
      if(usuarioActual.username){
        this.usuariosService.getUsuarioPorUsername(usuarioActual.username).subscribe( (usuario) => this.usuario = usuario)
      }
    })
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

  editar(): void{
    this.usuariosService.editarUsuario(this.usuario).subscribe({
        next:
          json => {
            this.router.navigate(['/galeria'])
            swal('Usuario Actualizado', `${json.mensaje}: ${json.usuario.username}`, 'success')},
          error:
            err => {
              this.errores = err.error.errors as string[];
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
