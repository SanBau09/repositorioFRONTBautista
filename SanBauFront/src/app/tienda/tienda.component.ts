import { Component, OnInit } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import { TiendaService } from './tienda.service';
import { Articulo } from './articulo';
import { Categoria } from '../galeria/categoria';
import { GaleriaService } from '../galeria/galeria.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {
  articulos: Articulo[];
  articulosFiltrados: Articulo[];
  articuloAEditar: Articulo;
  categorias: Categoria[];

  displayActivationDialog: boolean = false;     // Variable para controlar la visibilidad del diálogo de editar ilustración

  public errores: string[];

  constructor(private galeriaService: GaleriaService, private tiendaService: TiendaService, public authService: AuthService){}

  ngOnInit(): void {
    this.obtenerArticulos();
    this.obtenerCategorias();
    
  }

  obtenerArticulos(): void {
    this.tiendaService.getArticulos().subscribe(
      (articulos: Articulo[]) => {
        this.articulos = articulos;
        this.articulosFiltrados = articulos; // Inicialmente mostrar todas
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

  mostrarPDialogEditarArticulo(articulo): void{
    this.displayActivationDialog = true; // Mostrar el diálogo
    this.articuloAEditar = articulo;
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

}
