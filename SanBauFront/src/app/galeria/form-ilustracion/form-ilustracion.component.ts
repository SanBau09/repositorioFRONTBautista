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
  public titulo: string = "Añadir Ilustración";
  categorias: Categoria[];

  fotoSeleccionada: File;
  progreso:number = 0;
  categoriaSeleccionada: Categoria;

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de crear categoría
  nuevaCategoria: Categoria = null;

  public errores: string[];

  constructor(private galeriaService: GaleriaService, private router: Router, private activatedRoute: ActivatedRoute){}

  ngOnInit(){
    this.galeriaService.getCategorias().subscribe(categorias => this.categorias = categorias.filter(categoria => categoria.esGaleria));  // Filtrar categorías);
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
      this.ilustracion.categorias = [this.categoriaSeleccionada]; // Assign only the selected category
      this.galeriaService.create(this.ilustracion, this.fotoSeleccionada).subscribe({
        next:
          ilustracion => {
            this.router.navigate(['/galeria/ilustraciones'])
            swal('Nueva ilustración', `La ilustración ${ilustracion.titulo} ha sido creada con éxito`, 'success');},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
      });
    }
  }

  createCategoria(): void{
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

  mostrarPDialogCategoria(): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.nuevaCategoria = new Categoria();
  }
/*
  subirFoto(){ //nos aseguramos que el archivo sea de tipo imagen
    if(!this.fotoSeleccionada){
      swal('Error Upload: ', 'Debe seleccionar una foto', 'error');
    }else{
      this.clienteService.subirFoto(this.fotoSeleccionada, this.cliente.id)
      .subscribe(event =>{
        if(event.type === HttpEventType.UploadProgress){
          this.progreso = Math.round((event.loaded/event.total)*100);
        }else if(event.type === HttpEventType.Response){
          let response:any = event.body;
          this.cliente = response.cliente as Cliente;

          this.modalService.notificarUpload.emit(this.cliente);

          swal('La foto se ha subido correctamente!', response.mensaje, 'success');
        }


        //this.cliente = cliente;
       
      });
    }
  }
  */
}
