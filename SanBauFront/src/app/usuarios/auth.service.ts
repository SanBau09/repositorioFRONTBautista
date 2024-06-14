import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Usuario } from './usuario';

/**
 * Servicio para la gestión de autenticación y autorización de usuarios.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _usuario: Usuario;
  private _token: string;

  constructor(private http: HttpClient) { }

    /**
   * Obtiene el objeto Usuario actualmente autenticado.
   * Si no hay un usuario autenticado en memoria y existe en sessionStorage, lo recupera.
   * returns El objeto Usuario actualmente autenticado o un nuevo Usuario si no hay ninguno.
   */
  public get usuario(): Usuario {
    if (this._usuario != null) {
      return this._usuario;
    } else if (this._usuario == null && sessionStorage.getItem('usuario') != null) {
      this._usuario = JSON.parse(sessionStorage.getItem('usuario')) as Usuario;
      return this._usuario;
    }
    return new Usuario();
  }

  /**
   * Obtiene el token de acceso actual.
   * Si no hay un token almacenado en memoria y existe en sessionStorage, lo recupera.
   * returns El token de acceso actual o null si no hay ninguno.
   */
  public get token(): string {
    if (this._token != null) {
      return this._token;
    } else if (this._token == null && sessionStorage.getItem('token') != null) {
      this._token = sessionStorage.getItem('token');
      return this._token;
    }
    return null;
  }

  /**
   * Realiza una solicitud de inicio de sesión al servidor de autenticación.
   * param usuario El objeto Usuario con las credenciales de inicio de sesión.
   * returns Observable que emite la respuesta de la solicitud HTTP al servidor.
   */
  login(usuario: Usuario): Observable<any> {
    const urlEndpoint = 'http://localhost:8080/oauth/token';

    const credenciales = btoa('angularApp' + ':' + '1234');

    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credenciales
    });

    let params = new URLSearchParams();
    params.set('grant_type', 'password');
    params.set('username', usuario.username);
    params.set('password', usuario.password);
    console.log(params.toString());
    return this.http.post<any>(urlEndpoint, params.toString(), { headers: httpHeaders });
  }

  /**
   * Guarda los datos del usuario obtenidos del token de acceso en sessionStorage.
   * param accessToken El token de acceso JWT recibido del servidor de autenticación.
   */
  guardarUsuario(accessToken: string): void {
    let payload = this.obtenerDatosToken(accessToken);
    this._usuario = new Usuario();
    this._usuario.nombre = payload.nombre;
    this._usuario.apellidos = payload.apellidos;
    this._usuario.email = payload.email;
    this._usuario.username = payload.user_name;
    this._usuario.roles = payload.authorities;
    sessionStorage.setItem('usuario', JSON.stringify(this._usuario));
  }

  /**
   * Guarda el token de acceso en sessionStorage.
   * param accessToken El token de acceso JWT recibido del servidor de autenticación.
   */
  guardarToken(accessToken: string): void {
    this._token = accessToken;
    sessionStorage.setItem('token', accessToken);
  }

    
  /**
   * Decodifica y obtiene los datos del token de acceso JWT.
   * param accessToken El token de acceso JWT recibido del servidor de autenticación.
   * returns Los datos del token decodificados o null si el token es inválido.
   */
  obtenerDatosToken(accessToken: string): any {
    if (accessToken != null) {
      return JSON.parse(atob(accessToken.split(".")[1]));
    }
    return null;
  }

  /**
   * Verifica si el usuario está autenticado.
   * returns true si el usuario está autenticado, false en caso contrario.
   */
  isAuthenticated(): boolean {
    let payload = this.obtenerDatosToken(this.token);
    if (payload != null && payload.user_name && payload.user_name.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Verifica si el usuario tiene un rol específico.
   * param rol El nombre del rol a verificar.
   * returns true si el usuario tiene el rol especificado, false en caso contrario.
   */
  hasRol(rol: string): boolean {
    if (this.usuario.roles.includes(rol)) {
      return true;
    }
    return false;
  }

  /**
   * Cierra la sesión del usuario eliminando el token y los datos de usuario de sessionStorage.
   */
  logout(): void {
    this._token = null;
    this._usuario = null;
    sessionStorage.clear();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('listaCarrito');
  }
  
}
