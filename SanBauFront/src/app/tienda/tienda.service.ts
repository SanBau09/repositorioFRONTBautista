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

  /**
   * Carga el carrito de compras desde el almacenamiento de sesión.
   * returns Arreglo de ItemCompra que representa el carrito de compras.
   */
  private loadCarritoFromSessionStorage(): ItemCompra[] {
    const storedCarrito = sessionStorage.getItem('listaCarrito');
    return storedCarrito ? JSON.parse(storedCarrito) as ItemCompra[] : [];
  }

  /**
   * Guarda el carrito de compras en el almacenamiento de sesión.
   */
  private saveCarritoToSessionStorage(): void {
    sessionStorage.setItem('listaCarrito', JSON.stringify(this._listaCarrito));
  }

   /**
   * Obtiene la lista actual del carrito de compras.
   * returns Arreglo de ItemCompra que representa el carrito de compras actual.
   */
  public get listaCarrito(): ItemCompra[] {
    return this._listaCarrito;
  }

   /**
   * Agrega un artículo al carrito de compras.
   * param itemCompra Objeto de tipo ItemCompra que se va a agregar al carrito.
   */
  public agregarArticuloAlCarrito(itemCompra: ItemCompra): void {
    this._listaCarrito.push(itemCompra);
    this.saveCarritoToSessionStorage();
    this.carritoCambiado.next();
  }

  /**
   * Elimina un artículo del carrito de compras.
   * param articuloId ID del artículo que se desea eliminar del carrito.
   */
  public eliminarArticuloDelCarrito(articuloId: number): void {
    this._listaCarrito = this._listaCarrito.filter(item => item.articulo.id !== articuloId);
    this.saveCarritoToSessionStorage();
    this.carritoCambiado.next();
  }
  
  /**
   * Vacía completamente el carrito de compras.
   */
  public vaciarCarrito(): void {
    this._listaCarrito = [];
    sessionStorage.removeItem('listaCarrito');
    this.carritoCambiado.next();
  }

   /**
   * Crea una nueva venta.
   * param venta Objeto de tipo Venta que representa la venta a crear.
   * returns Observable que contiene el objeto Venta creado.
   */
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

  /**
   * Obtiene todas las ventas.
   * returns Observable que contiene un arreglo de objetos Venta.
   */
  getVentas(): Observable<Venta[]>{
    return this.http.get<Venta[]>(this.urlEndPoint + '/ventas', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        //this.isNoAutorizado(e);

        return throwError(()=>e);
      })
    );
  }

  /**
   * Agrega el token de autorización al encabezado HTTP si está disponible.
   * returns Encabezados HTTP con el token de autorización, si está autenticado.
   */
  private agregarAuthorizationHeader(){
    let token = this.authService.token;

    if(token != null){
      return this.httpHeaders.append('Authorization', 'Bearer' + token);
    }
    return this.httpHeaders;
  }

  /**
   * Maneja los errores relacionados con la autorización.
   * param e Error recibido en la respuesta HTTP.
   * returns true si el error indica falta de autorización (401 o 403), false de lo contrario.
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
      this.router.navigate(['/tienda']);

      return true;
    }
    return false;
  }
  
  /**
   * Crea un nuevo artículo junto con su imagen.
   * param articulo Objeto de tipo Articulo que representa el artículo a crear.
   * param archivo Archivo de imagen asociado al artículo.
   * returns Observable que contiene el objeto Articulo creado.
   */
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

  /**
   * Actualiza un artículo existente.
   * param articulo Objeto de tipo Articulo que representa el artículo a actualizar.
   * returns Observable que contiene la respuesta de la operación HTTP.
   */
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

  /**
   * Sube una foto asociada a un artículo.
   * param archivo Archivo de imagen que se va a subir.
   * param id ID del artículo al que se asociará la imagen.
   * returns Observable que contiene el progreso de la operación HTTP.
   */
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

  /**
   * Elimina un artículo existente.
   * param id ID del artículo que se desea eliminar.
   * returns Observable que contiene el objeto Articulo eliminado.
   */
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

   /**
   * Obtiene todos los artículos disponibles.
   * returns Observable que contiene un arreglo de objetos Articulo.
   */
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
  
  /**
   * Crea un nuevo formato asociado a un artículo.
   * param formato Objeto de tipo Formato que representa el formato a crear.
   * returns Observable que contiene el objeto Formato creado.
   */
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

  /**
   * Obtiene todos los formatos disponibles.
   * returns Observable que contiene un arreglo de objetos Formato.
   */
  getFormatos(): Observable<Formato[]>{
    return this.http.get<Formato[]>(this.urlEndPoint + '/formatos', {headers: this.agregarAuthorizationHeader()}).pipe(
      catchError(e=>{
        //this.isNoAutorizado(e);

        return throwError(()=>e);
      })
    );
  }

  /**
   * Elimina un formato existente.
   * param id ID del formato que se desea eliminar.
   * returns Observable que contiene el objeto Formato eliminado.
   */
  eliminarFormato(id: number): Observable<Formato>{
    return this.http.delete<Formato>(` ${this.urlEndPoint}/formatos/${id}`, {headers: this.agregarAuthorizationHeader()}).pipe(
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

}
