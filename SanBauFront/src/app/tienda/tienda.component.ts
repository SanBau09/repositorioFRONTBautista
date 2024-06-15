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

  ngOnInit(): void {
    this.obtenerArticulos();
    this.obtenerCategorias();
    this.obtenerFormatos();
  }

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

  mostrarPDialogFormato(): void{
    this.displayBorrarFormatoDialog = true; // Mostrar el diálogo
  }

  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }

  filtrarPorCategoria(categoriaId: string): void {
    if (categoriaId === '') {
      this.articulosFiltrados= this.articulos;
    } else {
      this.articulosFiltrados = this.articulos.filter(articulo => articulo.categorias.some(categoria => categoria.id === parseInt(categoriaId, 10)));
    }
  }

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

  seleccionarFoto(event){  //nos aseguramos que el archivo sea de tipo imagen
    this.fotoSeleccionada = event.target.files[0];
    this.progreso = 0;

    console.log(this.fotoSeleccionada);

    if(this.fotoSeleccionada.type.indexOf('image') < 0){
      swal('Error Seleccionar imagen: ', 'El archivo debe ser de tipo imagen', 'error');
      this.fotoSeleccionada = null;
    }
  }

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

  mostrarDetallesArticulo(articulo: Articulo): void {
    this.articuloSeleccionado = articulo;
    this.formatoSeleccionado = new Formato();
    this.cantidadSeleccionada = 1;
    this.displayDetallesDialog = true;
  }

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
