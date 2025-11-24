import { Crop } from './crop.entity';

export class CropAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Crop {
    const crop = new Crop();
    crop.id = resource.id;
    // El backend puede enviar 'crop' en lugar de 'title'
    crop.title = resource.title || resource.crop || '';
    // Mapeo de fechas: aceptar snake_case y camelCase
    crop.planting_date = resource.planting_date || resource.plantingDate || '';
    crop.harvest_date = resource.harvest_date || resource.harvestDate || '';
    crop.field = resource.field || '';
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
