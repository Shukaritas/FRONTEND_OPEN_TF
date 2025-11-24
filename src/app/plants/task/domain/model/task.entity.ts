export class Task{
  id:number;
  description:string;
  due_date:string;
  field:string;

  constructor(){
    this.id=0;
    this.description="";
    this.due_date="";
    this.field="";
  }
}
