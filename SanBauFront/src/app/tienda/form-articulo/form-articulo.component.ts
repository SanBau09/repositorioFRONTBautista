import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TiendaService } from '../tienda.service';
import { Articulo } from '../articulo';
import swal from 'sweetalert2';
import { Categoria } from 'src/app/galeria/categoria';
import { GaleriaService } from 'src/app/galeria/galeria.service';
import { Formato } from '../formato';

/**
 * Componente Angular para la gestión de formulario de creación de artículos.
 * Permite crear, gestionar y eliminar categorías y formatos asociados a los artículos.
 */
@Component({
  selector: 'app-form-articulo',
  templateUrl: './form-articulo.component.html',
  styleUrls: ['./form-articulo.component.css']
})
export class FormArticuloComponent implements OnInit{
  public articulo: Articulo = new Articulo();
  public formatos: Formato[] = [];

  public errores: string[];

  fotoSeleccionada: File;
  categoriaSeleccionada: Categoria;
  formatoSeleccionados: Formato[];
  formatosSeleccionadosABorrar: Formato[] = [];
  categorias: Categoria[];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de crear categoría
  nuevaCategoria: Categoria = null;
  nuevoFormato: Formato = new Formato(); // Nuevo formato a crear
  displayBorrarFormatoDialog: boolean = false;

  progreso:number = 0;

  constructor(private tiendaService: TiendaService, private galeriaService: GaleriaService, private router: Router, private activatedRoute: ActivatedRoute){

  }

  /**
   * Método que se ejecuta al inicializar el componente.
   * Recupera las categorías y formatos disponibles.
   */
  ngOnInit(){
    this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => !categoria.esGaleria));  // Filtrar categorías);
   
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
   * Compara dos objetos de tipo Categoria para determinar si son iguales.
   * param o1 Primer objeto de tipo Categoria a comparar
   * param o2 Segundo objeto de tipo Categoria a comparar
   * returns true si los objetos son iguales, false en caso contrario
   */
  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }

  /**
   * Crea un nuevo artículo con la información ingresada y la foto seleccionada.
   * Muestra mensajes de error si no se ha seleccionado una foto o si ocurre un error en la creación.
   */
  create(): void{

    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.articulo.categorias = [this.categoriaSeleccionada]; // Assign only the selected category
      this.articulo.formatos = this.formatoSeleccionados;
      this.tiendaService.create(this.articulo, this.fotoSeleccionada).subscribe({
        next:
          articulo => {
            this.router.navigate(['/tienda/articulos']);
            this.fotoSeleccionada = null;
            swal('Nuevo articulo', `El articulo ${articulo.titulo} ha sido creado con éxito`, 'success');},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  /**
   * Crea una nueva categoría con el nombre ingresado.
   * Muestra un mensaje de error si la categoría ya existe o si ocurre un error en la creación.
   */
  createCategoria(): void{
    if(this.categorias.find(x => x.nombre.toLocaleLowerCase() == this.nuevaCategoria.nombre.toLocaleLowerCase())){
      swal('Categoria Existente', `La categoría ${this.nuevaCategoria.nombre} ya existe!`, 'error');
    } else{
      this.nuevaCategoria.esGaleria = false;
      this.galeriaService.createCategoria(this.nuevaCategoria).subscribe({
        next:
          categoria => {
            this.displayActivationDialog = false;
            this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => !categoria.esGaleria));  // Filtrar categorías);
            swal('Nueva categoría', `La categoría ${categoria.nombre} ha sido creada con éxito`, 'success');},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  /**
   * Elimina la categoría seleccionada.
   * Muestra un mensaje de éxito si la categoría se elimina correctamente.
   * Muestra un mensaje de error si no se ha seleccionado una categoría.
   */
  eliminarCategoria(): void {
    if(this.categoriaSeleccionada){
      this.galeriaService.eliminarCategoria(this.categoriaSeleccionada.id).subscribe(
        response => {
          this.categorias = this.categorias.filter(cat => cat !== this.categoriaSeleccionada);
          
          swal(
            'Categoría Eliminada!',
            `Categoría ${this.categoriaSeleccionada.nombre} eliminada con éxito`,
            'success');
  
            this.categoriaSeleccionada = null;
      });
    }else{
      swal('Error','Seleccione una categoría para eliminar' , 'error');
    }
    
  }

  /**
   * Crea un nuevo formato con el tamaño ingresado.
   * Muestra un mensaje de error si el formato ya existe o si ocurre un error en la creación.
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
   * Elimina los formatos seleccionados para eliminar.
   * Muestra un mensaje de éxito si los formatos se eliminan correctamente.
   * Muestra un mensaje de error si no se ha seleccionado ningún formato.
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
   * Muestra el diálogo modal para confirmar la eliminación de formatos.
   */
  mostrarPDialogFormato(): void{
    this.displayBorrarFormatoDialog = true; // Mostrar el diálogo
  }

  /**
   * Muestra el diálogo modal para la creación de una nueva categoría.
   * Inicializa la nueva categoría a crear.
   */
  mostrarPDialogCategoria(): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.nuevaCategoria = new Categoria();
  }

  /**
   * Selecciona una foto para ser cargada como parte de la creación de un artículo.
   * Verifica que el archivo seleccionado sea de tipo imagen y muestra un mensaje de error si no lo es.
   * param event Evento del cambio de archivo que contiene la foto seleccionada
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
}
