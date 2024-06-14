import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import { TiendaService } from '../tienda/tienda.service';
import swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ItemCompra } from '../tienda/itemCompra';
import { Venta } from '../tienda/venta';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Articulo } from '../tienda/articulo';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy{
  displayCarritoDialog: boolean = false;
  carrito: ItemCompra[] = [];
  total: number = 0;
  totalArticulos: number = 0;
  gastosEnvio: number = 9; 
  carritoSubscription: Subscription;


  constructor(public authService:AuthService,public tiendaService:TiendaService, public usuariosService:UsuariosService,public router: Router){
    // Suscribirse a los cambios del carrito para actualizar el total de artículos
    this.tiendaService.carritoCambiado.subscribe(() => {
      this.actualizarTotalArticulos();
    });
  }

  /**
   * Inicializa el componente y suscribe a cambios en el carrito.
   */
  ngOnInit(): void {
    // Inicializar el carrito desde el servicio
    this.carrito = this.tiendaService.listaCarrito;
    this.actualizarTotalArticulos();

    // Suscribirse a cambios en el carrito
    this.carritoSubscription = this.tiendaService.carritoCambiado.subscribe(() => {
      this.carrito = this.tiendaService.listaCarrito;
      this.actualizarTotalArticulos();
    });
  }

  /**
   * Cancela la suscripción al carrito cuando el componente se destruye.
   */
  ngOnDestroy(): void {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout():void{
    this.authService.logout();

    swal('Logout', 'Has cerrado tu sesión', 'success');
    this.router.navigate(['/login']);
  }

  /**
   * Muestra el diálogo del carrito si hay artículos.
   */
  irAlCarrito(): void{
    if(this.tiendaService.listaCarrito == null || this.tiendaService.listaCarrito.length == 0){
      swal('Carrito', 'Aún no se han agregado artículos al carrito', 'warning');
    }else{
      this.carrito = this.tiendaService.listaCarrito;
      this.calcularTotal();
      this.displayCarritoDialog = true;
    }
  }

  /**
   * Calcula el total del carrito incluyendo los gastos de envío.
   */
  calcularTotal(): void {
    const totalSinEnvio = this.carrito.reduce((sum, item) => sum + (item.articulo.precio * item.cantidad), 0);
    this.total = parseFloat((totalSinEnvio + this.gastosEnvio).toFixed(2));
    this.totalArticulos = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  /**
   * Realiza la compra de los artículos en el carrito.
   */
  realizarCompra(): void {
    if(this.total > 0 && this.totalArticulos > 0){
      let venta = new Venta();
      this.usuariosService.getUsuarioPorUsername(this.authService.usuario.username).subscribe({
        next:
          (usuario) => {     
          venta.usuario = usuario;
          venta.precioTotal = this.total;
          venta.articulos = this.obtenerArticulosUnicosDelCarrito();
          this.tiendaService.createVenta(venta).subscribe({
            next:
              venta => {
                this.router.navigate(['/tienda'])
                swal('Compra', `Compra realizada con éxito`, 'success');
                this.tiendaService.vaciarCarrito();
                this.carrito = [];
                this.total = 0;
                this.totalArticulos = 0;
                this.displayCarritoDialog = false;},
              error:
                err => {
                  swal('Compra', `Ha habido un error al realizar la compra`, 'error');}
          });  
        },
        error:
                err => {
                  swal('Compra', `Ha habido un error al realizar la compra`, 'error');}
      });
    }else{
      swal('Compra', 'La compra no se ha podido realizar!', 'error');
    }
  }

    /**
   * Obtiene los artículos únicos del carrito.
   * returns {Articulo[]} Lista de artículos únicos.
   */
  obtenerArticulosUnicosDelCarrito(): Articulo[] {
    const articulosMap = new Map<number, Articulo>();
    this.carrito.forEach(item => {
      articulosMap.set(item.articulo.id, item.articulo);
    });
    return Array.from(articulosMap.values());
  }

    /**
   * Elimina un artículo del carrito.
   * {ItemCompra} item - El artículo a eliminar.
   */
  eliminarItem(item: ItemCompra) : void {
    swal({
      title: "Estás seguro?",
      text: `¿Desea borrar el artículo ${item.articulo.titulo} ?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminalo!"
    }).then((result) => {
      if (result.value) {

        this.tiendaService.eliminarArticuloDelCarrito(item.articulo.id);
        this.carrito = this.tiendaService.listaCarrito;
        this.calcularTotal();
        swal(
          'Artículo Eliminado!',
          `Artículo ${item.articulo.titulo} eliminado con éxito`,
          'success');
      };    
    });
  }

  /**
   * Actualiza el total de artículos en el carrito.
   */
  actualizarTotalArticulos(): void {
    this.totalArticulos = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }
}
