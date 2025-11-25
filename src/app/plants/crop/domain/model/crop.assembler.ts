import { Crop } from './crop.entity';

export class CropAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Crop {
    const crop = new Crop();
    crop.id = resource.id;
    // Preferir 'crop' (backend) y luego 'title' (frontend antiguo)
    crop.title = resource.crop || resource.title || '';
    // Fechas: preferir camelCase y luego snake_case
    crop.planting_date = resource.plantingDate || resource.planting_date || '';
    crop.harvest_date = resource.harvestDate || resource.harvest_date || '';
    // Campo: usar fieldId si viene, fallback a field
    crop.field = resource.fieldId || resource.field || '';
    crop.status = resource.status || '';
    crop.soilType = resource.soilType || resource.soil_type || '';
    crop.sunlight = resource.sunlight || resource.sunlightExposure || '';
    crop.watering = resource.watering || resource.wateringPlan || '';
    return crop;
  }

  /**
   * CORREGIDO: Convierte un array de recursos directamente a un array de Tasks.
   * Ya no espera un objeto contenedor.
   */
  public static toEntitiesFromResponse(response: any[]): Crop[] {
    return response.map(resource => this.toEntityFromResource(resource));
  }
}
