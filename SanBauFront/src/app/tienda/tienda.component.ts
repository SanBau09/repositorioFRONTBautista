import { Component, OnInit } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import { TiendaService } from './tienda.service';
import { Articulo } from './articulo';
import { Categoria } from '../galeria/categoria';
import { GaleriaService } from '../galeria/galeria.service';
import { Router } from '@angular/router';
import swal from 'sweetalert2';
import { HttpEventType } from '@angular/common/http';
import { Formato } from './formato';
import { ItemCompra } from './itemCompra';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {
  articulos: Articulo[];
  articulosFiltrados: Articulo[];
  articuloAEditar: Articulo;
  articuloAEditarOriginal: Articulo; // Añadir una copia de la ilustración
  categorias: Categoria[];
  formatos: Formato[] = [];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de editar articulo
  fotoSeleccionada: File;
  progreso:number = 0;

  public errores: string[];

  cantidadSeleccionada: number = 1;
  articuloSeleccionado: Articulo;
  formatoSeleccionados: Formato[] = [];
  formatoSeleccionado: Formato ;
  formatosSeleccionadosABorrar: Formato[] = [];
  nuevoFormato: Formato = new Formato(); // Nuevo formato a crear
  displayDetallesDialog: boolean = false; 
  displayBorrarFormatoDialog: boolean = false;
 

  constructor(private galeriaService: GaleriaService, private tiendaService: TiendaService, public authService: AuthService, public router: Router){}

  /**
   * Llama a los métodos para obtener los artículos, categorías y formatos disponibles.
   */
  ngOnInit(): void {
    this.obtenerArticulos();
    this.obtenerCategorias();
    this.obtenerFormatos();
  }

   /**
   * Obtiene todos los artículos disponibles desde el servicio TiendaService.
   * Actualiza las variables `articulos` y `articulosFiltrados`.
   */
  obtenerArticulos(): void {
    this.tiendaService.getArticulos().subscribe(
      (articulos: Articulo[]) => {
        this.articulos = articulos;
        this.articulosFiltrados = articulos; // Inicialmente mostrar todos
      },
      error => {
        console.error('Error al obtener articulos:', error);
      }
    );
  }

  /**
   * Obtiene todas las categorías disponibles desde el servicio GaleriaService.
   * Filtra las categorías para obtener solo aquellas que no son galería.
  */
  obtenerCategorias(): void {
    this.galeriaService.getCategorias().subscribe(
      (categorias: Categoria[]) => {
        this.categorias = categorias.filter(categoria => !categoria.esGaleria);
      },
      error => {
        console.error('Error al obtener categorías:', error);
      }
    );
  }

  /**
   * Obtiene todos los formatos disponibles desde el servicio TiendaService.
   * Actualiza la variable `formatos`.
  */
  obtenerFormatos(): void {
    this.tiendaService.getFormatos().subscribe(
      formatos => {
        this.formatos = formatos;
      },
      error => {
        console.error('Error al obtener formatos:', error);
      }
    );
  }

  /**
   * Crea un nuevo formato utilizando el servicio TiendaService.
   * Muestra mensajes de error o éxito utilizando la librería swal (SweetAlert2).
  */
  crearFormato(): void {
       
    if (!this.nuevoFormato || !this.nuevoFormato.tamanio) {
    swal('Error', 'Introduzca un formato', 'error');
    return;
    }

    if (this.formatos.find(x => x.tamanio.toLocaleLowerCase() === this.nuevoFormato.tamanio.toLocaleLowerCase())) {
      swal('Formato Existente', `El formato ${this.nuevoFormato.tamanio} ya existe!`, 'error');
    } else {
      this.tiendaService.crearFormato(this.nuevoFormato).subscribe(
        (formato: Formato) => {
          this.formatos.push(formato);
          swal('Formato Creado', `Formato ${formato.tamanio} creado con éxito!`, 'success');
          this.nuevoFormato = new Formato(); // Restablecer después de usarlo
        },
        error => {
          this.errores = error.error.errors as string[];
          console.error('Error al crear formato:', error);
        }
      );
    }
  }

  /**
   * Elimina los formatos seleccionados para eliminar utilizando el servicio TiendaService.
   * Actualiza la lista de formatos después de eliminar.
  */
  eliminarFormatos(): void{
    if(this.formatosSeleccionadosABorrar){
      this.formatosSeleccionadosABorrar.forEach( formato => {
        this.tiendaService.eliminarFormato(formato.id).subscribe(
          response => {
            this.formatos = this.formatos.filter(form => form !== formato);
            this.formatosSeleccionadosABorrar = this.formatosSeleccionadosABorrar.filter(form => form !== formato);
            swal(
              'Formato Eliminado!',
              `Formato eliminado con éxito`,
              'success');    
        });
      });
    }else{
      swal('Error','Seleccione al menos un formato para eliminar' , 'error');
    }
    
  }  

  /**
   * Muestra el diálogo para la eliminación de formatos.
  */
  mostrarPDialogFormato(): void{
    this.displayBorrarFormatoDialog = true; // Mostrar el diálogo
  }

  /**
   * Compara dos categorías para determinar si son iguales.
   * param o1 Primera categoría a comparar.
   * param o2 Segunda categoría a comparar.
   * returns true si las categorías son iguales, false de lo contrario.
  */
  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }

  /**
   * Filtra los artículos por la categoría seleccionada.
   * param categoriaId ID de la categoría por la cual se desea filtrar los artículos.
   */
  filtrarPorCategoria(categoriaId: string): void {
    if (categoriaId === '') {
      this.articulosFiltrados= this.articulos;
    } else {
      this.articulosFiltrados = this.articulos.filter(articulo => articulo.categorias.some(categoria => categoria.id === parseInt(categoriaId, 10)));
    }
  }

  /**
   * Edita un artículo utilizando el servicio TiendaService.
   * Actualiza la lista de artículos después de editar.
   */
  editarArticulo(): void{
    this.articuloAEditar.formatos = this.formatoSeleccionados;
    this.tiendaService.editarArticulo(this.articuloAEditar).subscribe({
      next:
          json => {
            this.displayActivationDialog = false;
            this.obtenerArticulos(); // Refrescar la lista de articulos
            swal('Articulo Actualizado', `${json.mensaje}: ${json.articulo.titulo}`, 'success')},
            
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
    });
  }

   /**
   * Selecciona una foto para subir.
   * param event Evento que contiene la información del archivo seleccionado.
   */
  seleccionarFoto(event){  //nos aseguramos que el archivo sea de tipo imagen
    this.fotoSeleccionada = event.target.files[0];
    this.progreso = 0;

    console.log(this.fotoSeleccionada);

    if(this.fotoSeleccionada.type.indexOf('image') < 0){
      swal('Error Seleccionar imagen: ', 'El archivo debe ser de tipo imagen', 'error');
      this.fotoSeleccionada = null;
    }
  }

    /**
   * Sube la foto seleccionada utilizando el servicio TiendaService.
   * Actualiza la foto del artículo después de subirla.
   */
  subirFoto(){ //nos aseguramos que el archivo sea de tipo imagen
    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.tiendaService.subirFoto(this.fotoSeleccionada, this.articuloAEditar.id)
      .subscribe(event =>{
        if(event.type === HttpEventType.UploadProgress){
          this.progreso = Math.round((event.loaded/event.total)*100);
        }else if(event.type === HttpEventType.Response){
          let response:any = event.body;
          this.articuloAEditar = response.articulo as Articulo;
          this.fotoSeleccionada = null;
          swal('La foto se ha subido correctamente!', response.mensaje, 'success');

          this.obtenerArticulos(); // Refrescar la lista de articulos
          
        }
      });
    }
  }

    /**
   * Muestra el diálogo para editar un artículo.
   * Guarda una copia profunda del artículo original y crea una copia del artículo a editar.
   * Filtra los formatos seleccionados del artículo.
   * param articulo El artículo a editar.
   */
  mostrarPDialogEditarArticulo(articulo): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.articuloAEditarOriginal = { ...articulo, categorias: [...articulo.categorias], formatos: [...articulo.formatos] }; // Guardar el estado original con una copia profunda de las categorías
    this.articuloAEditar = { ...articulo, categorias: [...articulo.categorias] }; // Crear una copia del objeto ilustración 
    this.formatoSeleccionados = this.formatos.filter(x => this.articuloAEditar.formatos.find(y => x.id == y.id) );   
    this.progreso = 0;
    this.fotoSeleccionada = null;
  }

  /**
  * Cancela la edición de una ilustración y revierte los cambios realizados.
  */
  cancelarEdicion(): void {
    Object.assign(this.articuloAEditar, this.articuloAEditarOriginal); // Revertir los cambios
    this.displayActivationDialog = false;
  }

  /**
   * Muestra los detalles de un artículo en un diálogo modal.
   * param articulo El artículo del cual se mostrarán los detalles.
  */
  mostrarDetallesArticulo(articulo: Articulo): void {
    this.articuloSeleccionado = articulo;
    this.formatoSeleccionado = new Formato();
    this.cantidadSeleccionada = 1;
    this.displayDetallesDialog = true;
  }

  /**
   * Elimina un artículo utilizando el servicio TiendaService.
   * Muestra un mensaje de confirmación antes de realizar la eliminación.
   * Actualiza la lista de artículos después de eliminar.
   * param articulo El artículo que se desea eliminar.
  */
  eliminarArticulo(articulo: Articulo) : void {
    swal({
      title: "Estás seguro?",
      text: `¿Desea borrar el artículo ${articulo.titulo} ?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminalo!"
    }).then((result) => {
      if (result.value) {

        this.tiendaService.eliminarArticulo(articulo.id).subscribe(
          response => {
            this.articulos = this.articulos.filter(art => art !== articulo);
            swal(
              'Ilustración Eliminada!',
              `Ilustración ${articulo.titulo} eliminada con éxito`,
              'success');

              this.obtenerArticulos();
            });
          }
    });
  }

  /**
   * Añade un artículo al carrito de compras.
   * Verifica si el usuario está autenticado antes de añadir el artículo.
   * Muestra mensajes de éxito o error utilizando swal (SweetAlert2).
   * param articuloSeleccionado El artículo seleccionado para añadir al carrito.
   * param formatoSeleccionado El formato seleccionado del artículo.
   * param cantidad La cantidad del artículo seleccionado.
  */
  aniadirArticulo(articuloSeleccionado : Articulo, formatoSeleccionado : Formato, cantidad : number): void {
    if (this.authService.isAuthenticated()){
      if(articuloSeleccionado && formatoSeleccionado){
        let item = new ItemCompra();
        item.articulo = articuloSeleccionado;
        item.formato = formatoSeleccionado;
        item.cantidad = cantidad;
        this.tiendaService.agregarArticuloAlCarrito(item);
        swal('Carrito',` Se ha añadido el artículo ${articuloSeleccionado.titulo} al carrito`, 'info');
      }else{
        swal('Carrito','Falta algún campo', 'error');
      }
    } else{
      swal('Carrito',`Necesita loguearse para poder agregar un artículo al carrito`, 'info');
      this.router.navigate(['/login']);
    }
    
  }

}
