export class Field{
  id:number;
  name:string;
  days:string;
  image_url:string;
  status:string;
  field_size:string; // nuevo: tamaño del campo (compatibilidad con fieldSize del backend)

  constructor(){
    this.id=0;
    this.name="";
    this.days="";
    this.image_url="";
    this.status="";
    this.field_size="";
  }
}
