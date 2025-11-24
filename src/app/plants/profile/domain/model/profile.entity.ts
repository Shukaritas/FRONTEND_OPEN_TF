export class User {
  id: number;
  user_name: string;      // Nombre completo
  email: string;          // Correo
  phone_number: string;   // Celular con código de país (ej: +51...)
  identificator: string;  // DNI (8 cifras)
  password?: string;      // Contraseña

  constructor() {
    this.id = 0;
    this.user_name = '';
    this.email = '';
    this.phone_number = '';
    this.identificator = '';
    this.password = '';
  }
}
