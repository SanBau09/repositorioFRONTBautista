import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from './usuario';
import { Observable, catchError, map, throwError } from 'rxjs';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Pais } from './pais';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private urlEndPoint:string = 'http://localhost:8080/users';
  private httpHeaders = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

  private agregarAuthorizationHeader(){
    let token = this.authService.token;

    if(token != null){
      return this.httpHeaders.append('Authorization', 'Bearer' + token);
    }
    return this.httpHeaders;
  }

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

  getPaises(): Observable<Pais[]>{
    return this.http.get<Pais[]>(this.urlEndPoint + '/paises', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        return throwError(()=>e);
      })
    );
  }

  
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
