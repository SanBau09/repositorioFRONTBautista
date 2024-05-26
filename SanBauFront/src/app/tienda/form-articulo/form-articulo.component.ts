import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TiendaService } from '../tienda.service';
import { Articulo } from '../articulo';
import swal from 'sweetalert2';
import { Categoria } from 'src/app/galeria/categoria';
import { GaleriaService } from 'src/app/galeria/galeria.service';

@Component({
  selector: 'app-form-articulo',
  templateUrl: './form-articulo.component.html',
  styleUrls: ['./form-articulo.component.css']
})
export class FormArticuloComponent implements OnInit{
  public articulo: Articulo = new Articulo();

  public errores: string[];

  fotoSeleccionada: File;
  categoriaSeleccionada: Categoria;
  categorias: Categoria[];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de crear categoría
  nuevaCategoria: Categoria = null;

  progreso:number = 0;

  constructor(private tiendaService: TiendaService, private galeriaService: GaleriaService, private router: Router, private activatedRoute: ActivatedRoute){}

  ngOnInit(){
    this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => !categoria.esGaleria));  // Filtrar categorías);
  }

  compararCategoria(o1: Categoria, o2:Categoria): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }

  create(): void{

    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.articulo.categorias = [this.categoriaSeleccionada]; // Assign only the selected category
      this.tiendaService.create(this.articulo, this.fotoSeleccionada).subscribe({
        next:
          articulo => {
            this.router.navigate(['/tienda/articulos'])
            swal('Nuevo articulo', `El articulo ${articulo.titulo} ha sido creado con éxito`, 'success');},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  createCategoria(): void{
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

  mostrarPDialogCategoria(): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.nuevaCategoria = new Categoria();
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
}
