import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, switchMap, forkJoin, of, map, filter, catchError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { enviroment } from '../../../../../../enviroment/enviroment';
import { CropService } from '../../../../../plants/crop/services/crop.services';

export interface Field {
  id: number; name: string; image_url: string; product: string; location: string;
  field_size: string; cropName: string; // renombrado el anterior string 'crop'
  days_since_planting: string; planting_date: string;
  expecting_harvest: string; "Soil Type": string; watering: string; sunlight: string;
  status: string; progress_history: { id: number; watered: string; fertilized: string; pests: string; }[];
  tasks: { id: number; date: string; name: string; task: string; }[];
  crop?: { id?: number; crop?: string; title?: string; status?: string; plantingDate?: string; harvestDate?: string; soilType?: string; sunlight?: string; watering?: string; }; // objeto cultivo
  // Opcionales para compatibilidad directa con backend
  imageUrl?: string;
  fieldSize?: string;
  progressHistoryId?: number; // nuevo opcional
}

@Component({
  selector: 'app-field-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatCheckboxModule, TranslatePipe],
  templateUrl: './field-details.component.html',
  styleUrls: ['./field-details.component.css']
})
export class FieldDetailsComponent implements OnInit {

  private fieldSubject = new BehaviorSubject<Field | null>(null);
  public field$ = this.fieldSubject.asObservable();
  private baseUrl = enviroment.BASE_URL;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cropService: CropService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => !!id),
      switchMap(id =>
        this.http.get<any>(`${this.baseUrl}/fields/${id}`).pipe(
          switchMap(fieldData => {
            const progressHistoryId = (fieldData as any).progressHistoryId;
            const progress$ = progressHistoryId
              ? this.http.get<any>(`${this.baseUrl}/progress/${progressHistoryId}`).pipe(catchError(() => of(null)))
              : of(null);
            const tasks$ = this.http.get<any[]>(`${this.baseUrl}/tasks/field/${fieldData.id}`).pipe(catchError(() => of([])));
            const crop$ = this.cropService.getCropByFieldId(fieldData.id).pipe(catchError(() => of(null)));
            return forkJoin({ progress: progress$, tasks: tasks$, crop: crop$ }).pipe(
              map(({ progress, tasks, crop }) => {
                const progressEntry = progress ? {
                  id: progress.id,
                  watered: progress.watered || progress.wateredDate || '',
                  fertilized: progress.fertilized || progress.fertilizedDate || '',
                  pests: progress.pests || progress.pestInspection || ''
                } : null;
                const mappedTasks = (tasks || []).map(t => ({
                  id: t.id,
                  date: t.due_date || t.dueDate || '',
                  name: fieldData.name,
                  task: t.description || t.task || t.name || ''
                }));
                const normalized: Field = {
                  ...fieldData,
                  image_url: fieldData.image_url || fieldData.imageUrl || '',
                  field_size: fieldData.field_size || fieldData.fieldSize || '',
                  product: fieldData.product || fieldData.mainProduct || '',
                  cropName: fieldData.crop || fieldData.cropName || '',
                  days_since_planting: fieldData.days_since_planting || fieldData.daysSincePlanting || '',
                  planting_date: fieldData.planting_date || fieldData.plantingDate || '',
                  expecting_harvest: fieldData.expecting_harvest || fieldData.expectingHarvest || '',
                  ["Soil Type"]: (fieldData as any)['Soil Type'] || fieldData.soilType || '',
                  watering: fieldData.watering || fieldData.wateringPlan || '',
                  sunlight: fieldData.sunlight || fieldData.sunlightExposure || '',
                  status: fieldData.status || '',
                  progress_history: progressEntry ? [progressEntry] : [],
                  tasks: mappedTasks,
                  crop: crop ? {
                    id: crop.id,
                    crop: (crop as any).crop || crop.title,
                    title: crop.title || (crop as any).crop || '',
                    status: crop.status || '',
                    plantingDate: (crop as any).plantingDate || crop.planting_date || '',
                    harvestDate: (crop as any).harvestDate || crop.harvest_date || '',
                    soilType: (crop as any).soilType || '',
                    sunlight: (crop as any).sunlight || '',
                    watering: (crop as any).watering || ''
                  } : undefined
                };
                return normalized;
              })
            );
          }),
          catchError(err => {
            console.error('Error cargando detalles del campo', err);
            return of(null);
          })
        )
      )
    ).subscribe(field => {
      this.fieldSubject.next(field);
    });
  }

  private formatDateToDDMMYYYY(isoDate: string): string {
    if (!isoDate) return '';
    // Extraer fecha básica YYYY-MM-DD
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    // Fallback con Date
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private parseDateFromDDMMYYYY(dateStr: string, originalIso?: string): string {
    if (!dateStr) return originalIso || '';
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      alert('Formato inválido. Usa DD/MM/YYYY.');
      return originalIso || '';
    }
    const [, dd, mm, yyyy] = match;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    if (day < 1 || month < 1 || month > 12 || year < 1900) {
      alert('Fecha fuera de rango.');
      return originalIso || '';
    }
    // No validar día exacto del mes de forma exhaustiva, confiar en Date
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      alert('Fecha inválida.');
      return originalIso || '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
  }

  editHistory(field: Field) {
    if (!field.progress_history || field.progress_history.length === 0) {
      alert('No hay historial de progreso para editar.');
      return;
    }
    const history = field.progress_history[0];
    if (!history || history.id == null) {
      alert('Historial sin ID, no puede actualizarse.');
      return;
    }

    const wateredDisplay = this.formatDateToDDMMYYYY(history.watered);
    const fertilizedDisplay = this.formatDateToDDMMYYYY(history.fertilized);
    const pestsDisplay = this.formatDateToDDMMYYYY(history.pests);

    const newWateredRaw = prompt("Enter new watered date (DD/MM/YYYY):", wateredDisplay);
    const newFertilizedRaw = prompt("Enter new fertilized date (DD/MM/YYYY):", fertilizedDisplay);
    const newPestsRaw = prompt("Enter new pest inspection date (DD/MM/YYYY):", pestsDisplay);

    const newWateredIso = newWateredRaw !== null && newWateredRaw !== wateredDisplay
      ? this.parseDateFromDDMMYYYY(newWateredRaw, history.watered)
      : history.watered;
    const newFertilizedIso = newFertilizedRaw !== null && newFertilizedRaw !== fertilizedDisplay
      ? this.parseDateFromDDMMYYYY(newFertilizedRaw, history.fertilized)
      : history.fertilized;
    const newPestsIso = newPestsRaw !== null && newPestsRaw !== pestsDisplay
      ? this.parseDateFromDDMMYYYY(newPestsRaw, history.pests)
      : history.pests;

    const updatedHistoryPayload = {
      watered: newWateredIso,
      fertilized: newFertilizedIso,
      pests: newPestsIso
    };

    this.http.put<any>(`${this.baseUrl}/progress/${history.id}`, updatedHistoryPayload).subscribe({
      next: (response) => {
        const updatedEntry = {
          id: response.id || history.id,
          watered: response.watered || response.wateredDate || newWateredIso,
          fertilized: response.fertilized || response.fertilizedDate || newFertilizedIso,
          pests: response.pests || response.pestInspection || newPestsIso
        };
        const normalized: Field = {
          ...field,
          progress_history: [updatedEntry]
        };
        this.fieldSubject.next(normalized);
        alert('History updated successfully!');
      },
      error: (err) => {
        console.error('Error updating progress history', err);
        alert('Error al actualizar el historial.');
      }
    });
  }

  addTask(field: Field) {
    const newDescription = prompt("Enter the new task description:");
    const newDueDateRaw = prompt("Enter the due date (DD/MM/YYYY):");

    if (!newDescription || !newDueDateRaw) {
      alert("Both description and due date are required.");
      return;
    }

    // Convertir la fecha DD/MM/YYYY a formato ISO compatible con Java
    const isoDate = this.parseDateFromDDMMYYYY(newDueDateRaw);
    if (!isoDate) {
      alert("Invalid date format. Use DD/MM/YYYY.");
      return;
    }

    // Construir payload que coincida con CreateTaskResource del backend
    const taskPayload = {
      fieldId: field.id,  // Importante: Enviar el ID, no el nombre
      description: newDescription,
      dueDate: isoDate    // Fecha convertida a ISO
    };

    // POST a /tasks (en plural) - NO hacer PUT al field después
    this.http.post<any>(`${this.baseUrl}/tasks`, taskPayload).subscribe({
      next: (res) => {
        // Mapear la respuesta del backend al formato que usa la vista
        const newTask = {
          id: res.id,
          date: res.dueDate || res.due_date || newDueDateRaw,
          name: field.name,
          task: res.description || newDescription
        };

        // Agregar tarea al array local para reflejar en pantalla sin recargar
        const existingTasks = Array.isArray(field.tasks) ? field.tasks : [];
        field.tasks = [...existingTasks, newTask];

        // Emitir el nuevo estado
        this.fieldSubject.next(field);
        alert('Task added successfully!');
      },
      error: (err) => {
        console.error('Error adding task:', err);
        alert('Error al agregar la tarea.');
      }
    });
  }

  editTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();

    // Buscar la tarea a editar
    const task = field.tasks.find(t => t.id === taskId);
    if (!task) {
      alert('Task not found.');
      return;
    }

    // Pedir nueva descripción (pre-llenada con la actual)
    const newDescription = prompt('Enter the new description:', task.task);
    if (newDescription === null) return; // Usuario canceló

    // Pedir nueva fecha (pre-llenada en formato DD/MM/YYYY)
    const currentDateFormatted = this.formatDateToDDMMYYYY(task.date);
    const newDateRaw = prompt('Enter the new due date (DD/MM/YYYY):', currentDateFormatted);
    if (newDateRaw === null) return; // Usuario canceló

    // Convertir fecha ingresada a formato ISO
    const newDateISO = this.parseDateFromDDMMYYYY(newDateRaw, task.date);
    if (!newDateISO) return; // Fecha inválida

    // Construir payload para el backend
    // Mantener el fieldId original (no se puede editar)
    const taskPayload = {
      fieldId: field.id,  // Mantener el fieldId original
      description: newDescription.trim() || task.task,
      dueDate: newDateISO
    };

    // Actualizar localmente de forma optimista
    const updatedTask = {
      ...task,
      task: newDescription.trim() || task.task,
      date: newDateISO
    };
    const updatedTasks = field.tasks.map(t => t.id === taskId ? updatedTask : t);
    const updatedField = { ...field, tasks: updatedTasks };
    this.fieldSubject.next(updatedField);

    // Llamar al backend para actualizar
    this.http.put<any>(`${this.baseUrl}/tasks/${taskId}`, taskPayload).subscribe({
      next: (response) => {
        console.log('Task updated successfully:', response);
        alert('Task updated successfully!');
        // Actualizar con la respuesta del backend
        const finalTask = {
          id: response.id || taskId,
          date: response.dueDate || response.due_date || newDateISO,
          name: field.name,
          task: response.description || newDescription
        };
        const finalTasks = field.tasks.map(t => t.id === taskId ? finalTask : t);
        this.fieldSubject.next({ ...field, tasks: finalTasks });
      },
      error: (err) => {
        console.error('Error updating task:', err);
        // Revertir cambios en caso de error
        this.fieldSubject.next(field);
        alert('Error updating task. Please try again.');
      }
    });
  }

  deleteTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    // Actualizar localmente de forma optimista
    const updatedTasks = field.tasks.filter(task => task.id !== taskId);
    const updatedField = { ...field, tasks: updatedTasks };
    this.fieldSubject.next(updatedField);

    // Llamar al servicio para eliminar del backend
    this.http.delete(`${this.baseUrl}/tasks/${taskId}`).subscribe({
      next: () => {
        console.log(`Task ${taskId} deleted successfully`);
        alert('Task deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting task:', err);
        // Revertir cambios en caso de error
        this.fieldSubject.next(field);
        alert('Error deleting task. Please try again.');
      }
    });
  }
}
