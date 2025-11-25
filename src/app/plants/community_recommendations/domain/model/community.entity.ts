export class Community{
  id:number;
  user:string;
  description:string;
  userId?: number; // ID del usuario autor para sincronizar cambios de nombre

  constructor() {
    this.id = 0;
    this.user='';
    this.description = '';
    this.userId = undefined;
  }
}
