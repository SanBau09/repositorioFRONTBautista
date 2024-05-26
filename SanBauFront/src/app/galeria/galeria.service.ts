import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../usuarios/auth.service';
import { Ilustracion } from './ilustracion';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import swal from 'sweetalert2';
import { Categoria } from './categoria';


@Injectable()
export class GaleriaService{
    private urlEndPoint:string = 'http://localhost:8080/galeria';
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


    create(ilustracion: Ilustracion, archivo: File) : Observable<Ilustracion> {

      let formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("ilustracion",JSON.stringify(ilustracion)); // Convertir objeto ilustracion a JSON y agregar al formulario

      let httpHeaders = new HttpHeaders();
      let token = this.authService.token;

      if(token != null){
        httpHeaders = httpHeaders.append('Authorization', 'Bearer' + token);
      }

      return this.http.post(this.urlEndPoint + "/ilustraciones", formData, {headers:httpHeaders}).pipe(
        map( (response : any) => response.ilustracion as Ilustracion),
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

    getIlustraciones(): Observable<any>{
      return this.http.get(this.urlEndPoint + "/ilustraciones").pipe(
        tap( (response : any) =>{
          console.log('GaleriaService: tap1');
          (response as Ilustracion[]).forEach( Ilustracion => {
            console.log(Ilustracion.id);
          })
        }),
      );
    }

    editarIlustracion(ilustracion: Ilustracion): Observable<any>{
      return this.http.put<any>(` ${this.urlEndPoint}/ilustraciones/${ilustracion.id}`, ilustracion, {headers: this.agregarAuthorizationHeader()}).pipe(
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

    subirFoto(archivo: File, id): Observable<HttpEvent<{}>>{
      let formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("id", id);
  
      let httpHeaders = new HttpHeaders();
      let token = this.authService.token;
  
      if(token != null){
        httpHeaders = httpHeaders.append('Authorization', 'Bearer' + token);
      }
  
      const req = new HttpRequest('POST', `${this.urlEndPoint}/ilustraciones/upload`, formData, {
        reportProgress: true,
        headers: httpHeaders
      });
  
      return this.http.request(req).pipe(
        catchError(e=>{
          this.isNoAutorizado(e);
  
          return throwError(()=>e);
        })
      );  //retorna un httpRquest con el progreso
       
    }

    eliminarIlustracion(id: number): Observable<Ilustracion>{
      return this.http.delete<Ilustracion>(` ${this.urlEndPoint}/ilustraciones/${id}`, {headers: this.agregarAuthorizationHeader()}).pipe(
        catchError(e=> {
  
          if(this.isNoAutorizado(e)){
            return throwError(()=>e);
          }
  
          console.error(e.error.mensaje);
          swal('Error al eliminar', e.error.mensaje, 'error');
          return throwError(()=>e);
        })
      )
    }


    getCategorias(): Observable<Categoria[]>{
      return this.http.get<Categoria[]>(this.urlEndPoint + '/categorias', {headers: this.agregarAuthorizationHeader()}).pipe(
        catchError(e=>{
          //this.isNoAutorizado(e);
  
          return throwError(()=>e);
        })
      );
    }

    createCategoria(categoria: Categoria) : Observable<Categoria> {
      return this.http.post(this.urlEndPoint + "/categorias", categoria, {headers:this.agregarAuthorizationHeader()}).pipe(
        map( (response : any) => response.categoria as Categoria),
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


    /*subirFoto(archivo: File, id): Observable<HttpEvent<{}>>{
      let formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("id", id);

      let httpHeaders = new HttpHeaders();
      let token = this.authService.token;

      if(token != null){
        httpHeaders = httpHeaders.append('Authorization', 'Bearer' + token);
      }

      const req = new HttpRequest('POST', `${this.urlEndPoint}/upload`, formData, {
        reportProgress: true,
        headers: httpHeaders
      });

      return this.http.request(req).pipe(
        catchError(e=>{
          this.isNoAutorizado(e);

          return throwError(()=>e);
        })
      );  //retorna un httpRquest con el progreso
      
    }
    */

}