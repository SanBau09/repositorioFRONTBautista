import { Component } from '@angular/core';
import { AuthService } from '../usuarios/auth.service';
import swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  title:string = 'Inicio';

  constructor(public authService:AuthService, public router: Router){}

  logout():void{
    this.authService.logout();

    swal('Logout', 'Has cerrado tu sesión', 'success');
    this.router.navigate(['/login']);
  }
}
