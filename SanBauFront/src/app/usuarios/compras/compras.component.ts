import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../usuarios.service';
import { Venta } from 'src/app/tienda/venta';
import { AuthService } from '../auth.service';
import swal from 'sweetalert2';
import { TiendaService } from 'src/app/tienda/tienda.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent  implements OnInit{

  ventas: Venta[];
  totalPedidos: number;
  constructor(public usuariosService:UsuariosService, public authService:AuthService, public tiendaService: TiendaService){}

  ngOnInit(): void {
    if (this.authService.hasRol('ROLE_ADMIN')){
      this.tiendaService.getVentas().subscribe({
        next:
          (ventas) => {     
            this.ventas = ventas;
            this.totalPedidos = this.ventas.length;
          },
        error:
          err => {
            swal('Usuario', `Ha habido un error al obtener los pedidos`, 'error');}
      });
    }
    else if (this.authService.hasRol('ROLE_USER')){
      let username = this.authService.usuario.username;
      if(username){
        this.usuariosService.getUsuarioPorUsername(username).subscribe({
          next:
            (usuario) => {     
              this.ventas = usuario.ventas;
              this.totalPedidos = this.ventas.length;
            },
          error:
            err => {
              swal('Usuario', `Ha habido un error al obtener los pedidos`, 'error');}
        });
      }
    }
  }

}
