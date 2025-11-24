import { Task } from './task.entity';

export class TaskAssembler {

  /**
   * Convierte un recurso de datos crudos a una instancia de Task.
   */
  public static toEntityFromResource(resource: any): Task {
    const task = new Task();
    task.id = resource.id;
    task.description = resource.description;
    // El backend envía dueDate (camelCase), mapear a due_date
    task.due_date = resource.dueDate || resource.due_date || '';
    // El backend envía fieldId (numérico), y no siempre field name
    task.field = resource.field || '';
    // Preservar el fieldId original en una propiedad dinámica para usos posteriores (edición)
    (task as any).fieldId = resource.fieldId ?? resource.field_id ?? null;
    return task;
  }

  /**
   * Convierte un array de recursos directamente a un array de Tasks.
   * Ya no espera un objeto contenedor.
   */
  public static toEntitiesFromResponse(response: any[]): Task[] {

    return response.map(resource => this.toEntityFromResource(resource));
  }
}
