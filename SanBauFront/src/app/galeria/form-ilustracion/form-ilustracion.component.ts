import { Component, OnInit } from '@angular/core';
import { Ilustracion } from '../ilustracion';
import { Categoria } from '../categoria';
import swal from 'sweetalert2';
import { GaleriaService } from '../galeria.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form-ilustracion',
  templateUrl: './form-ilustracion.component.html',
  styleUrls: ['./form-ilustracion.component.css']
})

export class FormIlustracionComponent implements OnInit{
  public ilustracion: Ilustracion = new Ilustracion();

  categorias: Categoria[];

  fotoSeleccionada: File;
  progreso:number = 0;
  categoriaSeleccionada: Categoria;

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de crear categoría
  nuevaCategoria: Categoria = null;

  public errores: string[];

  constructor(private galeriaService: GaleriaService, private router: Router, private activatedRoute: ActivatedRoute){}

    /**
   * Inicializa el componente cargando las categorías disponibles filtradas para la galería.
   */
  ngOnInit(){
    this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => categoria.esGaleria));  // Filtrar categorías);
  }

    /**
   * Maneja la selección de una foto, asegurándose de que sea de tipo imagen.
   * event - Evento de selección de archivo.
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
   * Compara dos categorías para verificar si son iguales.
   * o1 - Primera categoría a comparar.
   * o2 - Segunda categoría a comparar.
   * true si las categorías son iguales, false en caso contrario.
   */
  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }

  /**
   * Crea una nueva ilustración si se ha seleccionado una foto.
   */
  create(): void{

    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.ilustracion.categorias = [this.categoriaSeleccionada]; // Assign only the selected category
      this.galeriaService.create(this.ilustracion, this.fotoSeleccionada).subscribe({
        next:
          ilustracion => {
            this.router.navigate(['/galeria/ilustraciones']);
            this.fotoSeleccionada = null;
            swal('Nueva ilustración', `La ilustración ${ilustracion.titulo} ha sido creada con éxito`, 'success');},
          error:
            err => {              
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  /**
   * Crea una nueva categoría si no existe una con el mismo nombre.
   */
  createCategoria(): void{
    if(this.categorias.find(x => x.nombre.toLocaleLowerCase() == this.nuevaCategoria.nombre.toLocaleLowerCase())){
      swal('Categoria Existente', `La categoría ${this.nuevaCategoria.nombre} ya existe!`, 'error');
    } else{
      this.nuevaCategoria.esGaleria = true;
      this.galeriaService.createCategoria(this.nuevaCategoria).subscribe({
        next:
          categoria => {
            this.displayActivationDialog = false;
            this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => categoria.esGaleria));  // Filtrar categorías);
            swal('Nueva categoría', `La categoría ${categoria.nombre} ha sido creada con éxito`, 'success');},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  /**
   * Elimina la categoría seleccionada si hay una categoría seleccionada.
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
   * Muestra el diálogo para crear una nueva categoría y reinicia la variable nuevaCategoria.
   */
  mostrarPDialogCategoria(): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.nuevaCategoria = new Categoria();
    this.fotoSeleccionada = null;
  }

}
