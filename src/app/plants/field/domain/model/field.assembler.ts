import { Field } from './field.entity';

export class FieldAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Field {
    const field = new Field();
    field.id = resource.id;
    field.name = resource.name;
    field.days = resource.days;
    // Compatibilidad para imageUrl (camelCase) y image_url (snake_case)
    field.image_url = resource.imageUrl || resource.image_url;
    // Compatibilidad para fieldSize (camelCase) y field_size (snake_case)
    field.field_size = resource.fieldSize || resource.field_size || '';
    field.status = resource.status;
    return field;
  }

  /**
   * CORREGIDO: Convierte un array de recursos directamente a un array de Tasks.
   * Ya no espera un objeto contenedor.
   */
  public static toEntitiesFromResponse(response: any[]): Field[] {
    return response.map(resource => this.toEntityFromResource(resource));
  }
}
