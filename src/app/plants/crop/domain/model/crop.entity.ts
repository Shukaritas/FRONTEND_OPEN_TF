export class Crop{
  id:number;
  title:string;
  days:string;
  planting_date:string;
  harvest_date:string;
  field:string;
  status:string;
  fieldName?: string; // nombre del campo asociado (inyectado en frontend)
  soilType?: string;
  sunlight?: string;
  watering?: string;

  constructor(){
    this.id=0;
    this.title="";
    this.days="";
    this.planting_date="";
    this.harvest_date="";
    this.field="";
    this.status="";
    this.fieldName = undefined;
    this.soilType = undefined;
    this.sunlight = undefined;
    this.watering = undefined;
  }
}
