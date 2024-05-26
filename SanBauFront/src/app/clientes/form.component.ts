import { Component, OnInit } from '@angular/core';
import {Cliente} from './cliente';
import {ClienteService} from './cliente.service';
import { Router, ActivatedRoute } from '@angular/router';
import swal from 'sweetalert2';
import { Pais } from './pais';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html'
})
export class FormComponent implements OnInit {
  public cliente: Cliente = new Cliente();
  public titulo: string = "Crear Cliente";
  paises: Pais[];

  public errores: string[];

  constructor(private clienteService: ClienteService, private router: Router, private activatedRoute: ActivatedRoute){

  }

  ngOnInit(){
    this.cargarCliente();
    this.clienteService.getPaises().subscribe(paises => this.paises = paises);
  }

  cargarCliente(): void{
    this.activatedRoute.params.subscribe(params => {
      let id = params['id']
      if(id){
        this.clienteService.getCliente(id).subscribe( (cliente) => this.cliente = cliente)
      }
    })
  }
  //se maneja el objeto como un cliente
  public create(): void{
    this.clienteService.create(this.cliente).subscribe({
      next:
        cliente => {
          this.router.navigate(['/clientes'])
          swal('Nuevo cliente', `El cliente ${cliente.nombre} ha sido creado con éxito`, 'success');},
        error:
          err => {
            this.errores = err.error.errors as string[];
            console.error('Código del error desde el backend: ' + err.status);}
    });
  }

  //Se maneja el objeto como un any para luego manejarlo en el component como un json que recoge los mensajes del backend
  update(): void{
    this.clienteService.update(this.cliente).subscribe({
        next:
          json => {
            this.router.navigate(['/clientes'])
            swal('Cliente Actualizado', `${json.mensaje}: ${json.cliente.nombre}`, 'success')},
          error:
            err => {
              this.errores = err.error.errors as string[];
              console.error('Código del error desde el backend: ' + err.status);}
        });
  }

  compararPais(o1: Pais, o2:Pais): boolean{
    if(o1 === undefined && o2 === undefined){
      return true;
    }

    return o1 == null || o2 == null? false: o1.id == o2.id;
  }
}
