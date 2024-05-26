import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  public footer: any = {nombre: 'Sandra', apellidos: 'Bautista Cencerrado', fecha: '2024', texto: 'All rights reserved'};
}
