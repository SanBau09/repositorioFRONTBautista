import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import { Articulo } from './articulo';
import { Observable, Subject, catchError, map, tap, throwError } from 'rxjs';
import { Formato } from './formato';
import { ItemCompra } from './itemCompra';
import { Venta } from './venta';


@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private urlEndPoint:string = 'http://localhost:8080/tienda';
    private httpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
    private _listaCarrito : ItemCompra[];
    carritoCambiado = new Subject<void>();

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    this._listaCarrito = this.loadCarritoFromSessionStorage();
  }

   private loadCarritoFromSessionStorage(): ItemCompra[] {
    const storedCarrito = sessionStorage.getItem('listaCarrito');
    return storedCarrito ? JSON.parse(storedCarrito) as ItemCompra[] : [];
  }

  private saveCarritoToSessionStorage(): void {
    sessionStorage.setItem('listaCarrito', JSON.stringify(this._listaCarrito));
  }

  public get listaCarrito(): ItemCompra[] {
    return this._listaCarrito;
  }

  public agregarArticuloAlCarrito(itemCompra: ItemCompra): void {
    this._listaCarrito.push(itemCompra);
    this.saveCarritoToSessionStorage();
    this.carritoCambiado.next();
  }

  public eliminarArticuloDelCarrito(articuloId: number): void {
    this._listaCarrito = this._listaCarrito.filter(item => item.articulo.id !== articuloId);
    this.saveCarritoToSessionStorage();
    this.carritoCambiado.next();
  }

  public vaciarCarrito(): void {
    this._listaCarrito = [];
    sessionStorage.removeItem('listaCarrito');
    this.carritoCambiado.next();
  }

  createVenta(venta: Venta ) : Observable<Venta> {

    return this.http.post(this.urlEndPoint + "/venta", venta, {headers:this.agregarAuthorizationHeader()}).pipe(
      map( (response : any) => response.venta as Venta),
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

  getVentas(): Observable<Venta[]>{
    return this.http.get<Venta[]>(this.urlEndPoint + '/ventas', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        //this.isNoAutorizado(e);

        return throwError(()=>e);
      })
    );
  }

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
      this.router.navigate(['/tienda']);

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

  editarArticulo(articulo: Articulo): Observable<any>{
    return this.http.put<any>(` ${this.urlEndPoint}/articulos/${articulo.id}`, articulo, {headers: this.agregarAuthorizationHeader()}).pipe(
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

    const req = new HttpRequest('POST', `${this.urlEndPoint}/articulos/upload`, formData, {
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

  eliminarArticulo(id: number): Observable<Articulo>{
    return this.http.delete<Articulo>(` ${this.urlEndPoint}/articulos/${id}`, {headers: this.agregarAuthorizationHeader()}).pipe(
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

  getArticulos(): Observable<any>{
    return this.http.get(this.urlEndPoint + "/articulos").pipe(
      tap( (response : any) =>{
        console.log('TiendaService: tap1');
        (response as Articulo[]).forEach( Articulo => {
          console.log(Articulo.id);
        })
      }),
    );
  }

  getFormatosPorArticulo(articuloId){

  }
  
  crearFormato(formato: Formato): Observable<Formato>{
    return this.http.post(this.urlEndPoint + "/formatos", formato, {headers:this.agregarAuthorizationHeader()}).pipe(
      map( (response : any) => response.formato as Formato),
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

  getFormatos(): Observable<Formato[]>{
    return this.http.get<Formato[]>(this.urlEndPoint + '/formatos', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        //this.isNoAutorizado(e);

        return throwError(()=>e);
      })
    );
  }

}
