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

  /**
   * Método para cargar los datos del usuario actual si existe
   * Obtiene y carga la lista de países disponibles
   */
  ngOnInit(){
    this.cargarUsuario();
    this.usuariosService.getPaises().subscribe( paises => this.paises = paises);
  
  }

  /**
   * Carga los datos del usuario actual en el formulario de registro si está autenticado.
   */
  cargarUsuario(): void{
    this.activatedRoute.params.subscribe(params => {
      let usuarioActual = this.authService.usuario;
      if(usuarioActual.username){
        this.usuariosService.getUsuarioPorUsername(usuarioActual.username).subscribe( (usuario) => this.usuario = usuario)
      }
    })
  }
  
  /**
   * Crea un nuevo usuario utilizando el servicio UsuariosService.
   * Si la operación es exitosa, redirige al usuario a la página de inicio de sesión.
   * Si falla, muestra un mensaje de error utilizando SweetAlert2.
   */
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

  /**
   * Edita los datos del usuario utilizando el servicio UsuariosService.
   * Si la operación es exitosa, redirige al usuario a la página de la galería.
   * Si falla, muestra un mensaje de error y almacena los errores recibidos en this.errores.
   */
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

  /**
   * Compara dos objetos de tipo Pais para determinar si son iguales.
   * Se utiliza en la interfaz para preseleccionar el país actual del usuario en un campo select.
   * param o1 Primer objeto de tipo Pais a comparar
   * param o2 Segundo objeto de tipo Pais a comparar
   * returns True si los objetos son iguales, false en caso contrario
   */
  compararPais(o1: Pais, o2:Pais): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }
}
