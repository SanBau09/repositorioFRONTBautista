import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from './usuario';
import { Observable, catchError, map, throwError } from 'rxjs';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Pais } from './pais';

/**
 * Servicio para la gestión de operaciones relacionadas con usuarios y países.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private urlEndPoint:string = 'http://localhost:8080/users';
  private httpHeaders = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

    /**
   * Agrega el token de autorización a las cabeceras HTTP.
   * returns HttpHeaders con el token de autorización si está autenticado, de lo contrario, retorna las cabeceras estándar.
   */
  private agregarAuthorizationHeader(){
    let token = this.authService.token;

    if(token != null){
      return this.httpHeaders.append('Authorization', 'Bearer' + token);
    }
    return this.httpHeaders;
  }

  /**
   * Verifica si la respuesta HTTP indica que el usuario no está autorizado (401) o acceso denegado (403).
   * param e La respuesta HTTP de error.
   * returns true si el usuario no está autorizado o tiene acceso denegado, false en otros casos.
   */
  private isNoAutorizado(e): boolean{
    if(e.status == 401){
      if(this.authService.isAuthenticated()){
        this.authService.logout();
      }
      this.router.navigate(['/login']);

      return true;
    }
    if(e.status == 403){
      swal('Acceso denegado', 'no tienes permisos', 'warning');
      this.router.navigate(['/clientes']);

      return true;
    }
    return false;
  }
  
  /**
   * Realiza una solicitud HTTP POST para registrar un nuevo usuario.
   * param usuario El objeto Usuario que se va a registrar.
   * returns Observable que emite el usuario registrado en caso de éxito.
   */
  create(usuario: Usuario) : Observable<Usuario> {
    return this.http.post(this.urlEndPoint + "/registro", usuario, {headers:this.agregarAuthorizationHeader()}).pipe(
      map( (response : any) => response.usuario as Usuario),
      catchError(e=> {

        if(this.isNoAutorizado(e)){
          return throwError(()=>e);
        }

        if(e.status==400){
          return throwError(()=>e);
        }

        console.error(e.error.mensaje);
        swal(e.error.mensaje, e.error.error, 'error');
        return throwError(()=>e);
      })
    );
  }

  /**
   * Realiza una solicitud HTTP PUT para actualizar los datos de un usuario existente.
   * param usuario El objeto Usuario con los datos actualizados.
   * returns Observable que emite la respuesta de la solicitud HTTP.
   */
  editarUsuario(usuario: Usuario): Observable<any>{
    return this.http.put<any>(` ${this.urlEndPoint}/${usuario.id}`, usuario, {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=> {

        if(this.isNoAutorizado(e)){
          return throwError(()=>e);
        }
        if(e.status==400){
          return throwError(()=>e);
        }

        console.error(e.error.mensaje);
        swal(e.error.mensaje, e.error.error, 'error');
        return throwError(()=>e);
      })
    )
  }

  /**
   * Obtiene la lista de países desde el backend.
   * returns Observable que emite un array de objetos de tipo Pais.
   */
  getPaises(): Observable<Pais[]>{
    return this.http.get<Pais[]>(this.urlEndPoint + '/paises', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        return throwError(()=>e);
      })
    );
  }

  /**
   * Obtiene un usuario específico por su nombre de usuario desde el backend.
   * param username El nombre de usuario del usuario que se desea obtener.
   * returns Observable que emite el objeto Usuario encontrado.
   */
  getUsuarioPorUsername(username): Observable<Usuario>{
    return this.http.get<Usuario>(` ${this.urlEndPoint}/user/${username}`, {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e =>{
        if(this.isNoAutorizado(e)){
          return throwError(()=>e);
        }

        this.router.navigate(['/galeria']);
        console.error(e.error.mensaje);
        swal(e.error.mensaje, e.error.error, 'error');

        return throwError(()=>e);
    }));
  }

    /**
   * Obtiene un usuario específico por su ID desde el backend.
   * param id El ID del usuario que se desea obtener.
   * returns Observable que emite el objeto Usuario encontrado.
   */
  getUsuario(id): Observable<Usuario>{
    return this.http.get<Usuario>(` ${this.urlEndPoint}/${id}`, {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e =>{
        if(this.isNoAutorizado(e)){
          return throwError(()=>e);
        }

        this.router.navigate(['/galeria']);
        console.error(e.error.mensaje);
        swal(e.error.mensaje, e.error.error, 'error');

        return throwError(()=>e);
    }));
  }
}
