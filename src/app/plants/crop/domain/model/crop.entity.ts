export class Crop{
  id:number;
  title:string;
  days:string;
  planting_date:string;
  harvest_date:string;
  field:string;
  status:string;

  constructor(){
    this.id=0;
    this.title="";
    this.days="";
    this.planting_date="";
    this.harvest_date="";
    this.field="";
    this.status="";
  }
}
