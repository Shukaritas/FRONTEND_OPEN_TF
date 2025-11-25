import { Task } from './task.entity';

export class TaskAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Task {
    const task = new Task();
    task.id = resource.id;
    task.description = resource.description;
    // Mapeo correcto de fechas: backend dueDate -> entidad due_date
    task.due_date = resource.dueDate || resource.due_date || '';
    // Backend envía fieldId (numérico). Se mapea temporalmente al atributo field.
    task.field = resource.fieldId ?? resource.field_id ?? null as any; // Puede ser número; la entidad define string, se mantiene temporalmente
    // Preservar el fieldId original para usos adicionales si se requiere
    (task as any).fieldId = resource.fieldId ?? resource.field_id ?? null;
    return task;
  }

  /**
   * Convierte un array de recursos directamente a un array de Tasks.
   */
  public static toEntitiesFromResponse(response: any[]): Task[] {
    return response.map(resource => this.toEntityFromResource(resource));
  }
}
