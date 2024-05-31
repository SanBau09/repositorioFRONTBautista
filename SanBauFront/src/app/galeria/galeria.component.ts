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
  categorias: Categoria[];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de editar ilustración
  fotoSeleccionada: File;
  progreso:number = 0;


  public errores: string[];

  constructor(private galeriaService: GaleriaService, public authService: AuthService){}

  ngOnInit(): void {

    this.obtenerIlustraciones();
    this.obtenerCategorias();
    
  }

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

  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }




  filtrarPorCategoria(categoriaId: string): void {
    if (categoriaId === '') {
      this.ilustracionesFiltradas= this.ilustraciones;
    } else {
      this.ilustracionesFiltradas = this.ilustraciones.filter(ilustracion => ilustracion.categorias.some(categoria => categoria.id === parseInt(categoriaId, 10)));
    }
  }

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


  mostrarPDialogEditarIlustacion(ilustracion): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.ilustracionAEditar = ilustracion;
  }
  

}
