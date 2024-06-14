import { Component, OnInit } from '@angular/core';
import { Ilustracion } from './ilustracion';
import { GaleriaService } from './galeria.service';
import { AuthService } from '../usuarios/auth.service';
import swal from 'sweetalert2';
import { Categoria } from './categoria';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-galeria',
  templateUrl: './galeria.component.html',
  styleUrls: ['./galeria.component.css']
})
export class GaleriaComponent implements OnInit{

  ilustraciones: Ilustracion[];
  ilustracionesFiltradas: Ilustracion[];
  ilustracionAEditar: Ilustracion;
  ilustracionAEditarOriginal: Ilustracion; // Añadir una copia de la ilustración
  categorias: Categoria[];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de editar ilustración
  fotoSeleccionada: File;
  progreso:number = 0;


  public errores: string[];

  
  // Variable para controlar la visibilidad del modal de imagen en tamaño completo
  displayImageModal: boolean = false;
  modalImagenSeleccionada: Ilustracion;



  constructor(private galeriaService: GaleriaService, public authService: AuthService){}

  ngOnInit(): void {

    this.obtenerIlustraciones();
    this.obtenerCategorias();
    
  }

  /**
 * Obtiene las ilustraciones desde el servicio y las almacena en las variables locales.
 * Inicialmente, muestra todas las ilustraciones.
 */
  obtenerIlustraciones(): void {
    this.galeriaService.getIlustraciones().subscribe(
      (ilustraciones: Ilustracion[]) => {
        this.ilustraciones = ilustraciones;
        this.ilustracionesFiltradas = ilustraciones; // Inicialmente mostrar todas
      },
      error => {
        console.error('Error al obtener ilustraciones:', error);
      }
    );
  }
  /**
   * Obtiene las categorías desde el servicio y filtra solo aquellas que pertenecen a la galería.
   */
  obtenerCategorias(): void {
    this.galeriaService.getCategorias().subscribe(
      (categorias: Categoria[]) => {
        this.categorias = categorias.filter(categoria => categoria.esGaleria);
      },
      error => {
        console.error('Error al obtener categorías:', error);
      }
    );
  }

  /**
 * Compara dos objetos de tipo Categoria por su ID.
 * 
 *  o1 Primera categoría a comparar.
 *  o2 Segunda categoría a comparar.
 *  true si ambas categorías tienen el mismo ID o ambas son indefinidas; false en caso contrario.
 */
  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }


/**
 * Filtra las ilustraciones por una categoría específica.
 * 
 *  categoriaId El ID de la categoría por la cual se desea filtrar las ilustraciones.
 */
  filtrarPorCategoria(categoriaId: string): void {
    if (categoriaId === '') {
      this.ilustracionesFiltradas= this.ilustraciones;
    } else {
      this.ilustracionesFiltradas = this.ilustraciones.filter(ilustracion => ilustracion.categorias.some(categoria => categoria.id === parseInt(categoriaId, 10)));
    }
  }

  /**
   * Elimina una ilustración después de confirmar la acción mediante un cuadro de diálogo.
   * 
   * ilustracion La ilustración que se desea eliminar.
   */
  eliminarIlustracion(ilustracion: Ilustracion) : void {
    swal({
      title: "Estás seguro?",
      text: `¿Desea borrar la ilustración ${ilustracion.titulo} ?`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminalo!"
    }).then((result) => {
      if (result.value) {

        this.galeriaService.eliminarIlustracion(ilustracion.id).subscribe(
          response => {
            this.ilustraciones = this.ilustraciones.filter(ilu => ilu !== ilustracion);
            swal(
              'Ilustración Eliminada!',
              `Ilustración ${ilustracion.titulo} eliminada con éxito`,
              'success');

              this.obtenerIlustraciones();
            });
          }
    });
  }

  /**
   * Edita una ilustración y actualiza la lista de ilustraciones.
   */
  editarIlustracion(): void{
    this.galeriaService.editarIlustracion(this.ilustracionAEditar).subscribe({
      next:
          json => {
            this.displayActivationDialog = false;
            this.obtenerIlustraciones(); // Refrescar la lista de ilustraciones
            swal('Ilustración Actualizada', `${json.mensaje}: ${json.ilustracion.titulo}`, 'success')},
            
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
    });
  }

  /**
   * Selecciona una foto para subirla, asegurándose de que sea de tipo imagen.
   * 
   * event El evento de selección de archivo.
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
   * Sube la foto seleccionada y actualiza la lista de ilustraciones.
   */
  subirFoto(){ //nos aseguramos que el archivo sea de tipo imagen
    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.galeriaService.subirFoto(this.fotoSeleccionada, this.ilustracionAEditar.id)
      .subscribe(event =>{
        if(event.type === HttpEventType.UploadProgress){
          this.progreso = Math.round((event.loaded/event.total)*100);
        }else if(event.type === HttpEventType.Response){
          let response:any = event.body;
          this.ilustracionAEditar = response.ilustracion as Ilustracion;
          swal('La foto se ha subido correctamente!', response.mensaje, 'success');

          this.obtenerIlustraciones(); // Refrescar la lista de ilustraciones
          
        }
      });
    }
  }

  /**
   * Muestra el cuadro de diálogo para editar una ilustración.
   * 
   * ilustracion La ilustración que se desea editar.
   */
  mostrarPDialogEditarIlustracion(ilustracion): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.ilustracionAEditarOriginal = { ...ilustracion, categorias: [...ilustracion.categorias] }; // Guardar el estado original con una copia profunda de las categorías
    this.ilustracionAEditar = { ...ilustracion, categorias: [...ilustracion.categorias] }; // Crear una copia del objeto ilustración
    this.progreso = 0;
  }

  /**
   * Cancela la edición de una ilustración y revierte los cambios realizados.
   */
  cancelarEdicion(): void {
    Object.assign(this.ilustracionAEditar, this.ilustracionAEditarOriginal); // Revertir los cambios
    this.displayActivationDialog = false;
  }

  /**
   * Muestra una imagen en tamaño completo en un modal.
   * 
   * ilustracion La ilustración cuya imagen se desea mostrar en tamaño completo.
   */
  mostrarImagenModal(ilustracion: Ilustracion): void {
    this.modalImagenSeleccionada = ilustracion;
    this.displayImageModal = true;
  }

  /**
   * Cierra el modal de imagen en tamaño completo.
   */
  cerrarModalImagen(): void {
    this.displayImageModal = false;
    this.modalImagenSeleccionada = null;
  }
  

}
