import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import { Articulo } from './articulo';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Categoria } from '../galeria/categoria';


@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private urlEndPoint:string = 'http://localhost:8080/tienda';
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
  
  create(articulo: Articulo, archivo: File) : Observable<Articulo> {

    let formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("articulo",JSON.stringify(articulo)); // Convertir objeto articulo a JSON y agregar al formulario

    let httpHeaders = new HttpHeaders();
    let token = this.authService.token;

    if(token != null){
      httpHeaders = httpHeaders.append('Authorization', 'Bearer' + token);
    }

    return this.http.post(this.urlEndPoint + "/articulos", formData, {headers:httpHeaders}).pipe(
      map( (response : any) => response.articulo as Articulo),
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

}
