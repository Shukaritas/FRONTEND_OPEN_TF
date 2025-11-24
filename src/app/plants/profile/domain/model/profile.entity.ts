export class User {
  id: number;
  userName: string;      // Nombre completo
  email: string;         // Correo
  phoneNumber: string;   // Celular con código de país (ej: +51...)
  identificator: string; // DNI (8 cifras)
  password?: string;     // Contraseña

  constructor() {
    this.id = 0;
    this.userName = '';
    this.email = '';
    this.phoneNumber = '';
    this.identificator = '';
    this.password = '';
  }
}
