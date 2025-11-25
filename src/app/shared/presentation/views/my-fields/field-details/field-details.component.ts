import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, switchMap, forkJoin, of, map, filter, catchError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { enviroment } from '../../../../../../enviroment/enviroment';
import { CropService } from '../../../../../plants/crop/services/crop.services';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditHistoryDialogComponent } from '../edit-history-dialog/edit-history-dialog.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';

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
  imports: [CommonModule, RouterLink, MatIconModule, MatCheckboxModule, TranslatePipe, MatDialogModule],
  templateUrl: './field-details.component.html',
  styleUrls: ['./field-details.component.css']
})
export class FieldDetailsComponent implements OnInit {

  private fieldSubject = new BehaviorSubject<Field | null>(null);
  public field$ = this.fieldSubject.asObservable();
  private baseUrl = enviroment.BASE_URL;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cropService: CropService, private dialog: MatDialog, private translate: TranslateService) {}

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

                // Cálculo adicional: días hasta cosecha (si harvestDate disponible)
                if (normalized.crop?.harvestDate) {
                  const today = new Date(); today.setHours(0,0,0,0);
                  const harvestDate = new Date(normalized.crop.harvestDate); harvestDate.setHours(0,0,0,0);
                  if (!isNaN(harvestDate.getTime())) {
                    const diffTime = harvestDate.getTime() - today.getTime();
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) diffDays = 0;
                    // Reutilizamos days_since_planting para compatibilidad si estaba vacío, o añadimos un nuevo campo opcional
                    normalized.days_since_planting = diffDays.toString();
                  }
                }

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
      alert(this.translate.instant('DATE.ERROR_INVALID_FORMAT'));
      return originalIso || '';
    }
    const [, dd, mm, yyyy] = match;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    if (day < 1 || month < 1 || month > 12 || year < 1900) {
      alert(this.translate.instant('DATE.ERROR_OUT_OF_RANGE'));
      return originalIso || '';
    }
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      alert(this.translate.instant('DATE.ERROR_INVALID'));
      return originalIso || '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
  }

  editHistory(field: Field) {
    if (!field.progress_history || field.progress_history.length === 0) {
      // Reemplazar alert por diálogo informativo opcional, pero aquí simplemente retornamos
      return;
    }
    const history = field.progress_history[0];
    if (!history || history.id == null) {
      return;
    }

    // Abrir diálogo con fechas actuales
    const dialogRef = this.dialog.open(EditHistoryDialogComponent, {
      width: '400px',
      data: {
        watered: history.watered ? new Date(history.watered) : null,
        fertilized: history.fertilized ? new Date(history.fertilized) : null,
        pests: history.pests ? new Date(history.pests) : null,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return; // Cancelado

      // Convertir resultados Date a ISO (T00:00:00 para normalizar si son solo fechas)
      const toIso = (d?: Date | null) => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString() : '';
      const newWateredIso = toIso(result.watered);
      const newFertilizedIso = toIso(result.fertilized);
      const newPestsIso = toIso(result.pests);

      const updatedHistoryPayload = {
        watered: newWateredIso || history.watered,
        fertilized: newFertilizedIso || history.fertilized,
        pests: newPestsIso || history.pests
      };

      this.http.put<any>(`${this.baseUrl}/progress/${history.id}`, updatedHistoryPayload).subscribe({
        next: (response) => {
          const updatedEntry = {
            id: response.id || history.id,
            watered: response.watered || response.wateredDate || updatedHistoryPayload.watered,
            fertilized: response.fertilized || response.fertilizedDate || updatedHistoryPayload.fertilized,
            pests: response.pests || response.pestInspection || updatedHistoryPayload.pests
          };
          const normalized: Field = {
            ...field,
            progress_history: [updatedEntry]
          };
          this.fieldSubject.next(normalized);
        },
        error: (err) => {
          console.error('Error updating progress history', err);
        }
      });
    });
  }

  addTask(field: Field) {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return; // Cancelado

      const isoDate = new Date(result.dueDate.getFullYear(), result.dueDate.getMonth(), result.dueDate.getDate()).toISOString();

      const taskPayload = {
        fieldId: field.id,
        description: result.description,
        dueDate: isoDate
      };

      this.http.post<any>(`${this.baseUrl}/tasks`, taskPayload).subscribe({
        next: (res) => {
          const newTask = {
            id: res.id,
            date: res.dueDate || res.due_date || isoDate,
            name: field.name,
            task: res.description || result.description
          };
          const existingTasks = Array.isArray(field.tasks) ? field.tasks : [];
          const updated = { ...field, tasks: [...existingTasks, newTask] };
          this.fieldSubject.next(updated);
        },
        error: (err) => {
          console.error('Error adding task:', err);
        }
      });
    });
  }

  editTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();
    // Funcionalidad de edición movida a MyTasksComponent. Aquí se deja placeholder para evitar error en template.
    console.warn('editTask llamado en FieldDetailsComponent pero la edición se gestiona en MyTasksComponent');
  }

  deleteTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();

    // Aquí podríamos abrir un diálogo de confirmación, por ahora eliminamos confirm nativo
    const updatedTasks = field.tasks.filter(task => task.id !== taskId);
    const updatedField = { ...field, tasks: updatedTasks };
    this.fieldSubject.next(updatedField);

    this.http.delete(`${this.baseUrl}/tasks/${taskId}`).subscribe({
      next: () => {
        console.log(`Task ${taskId} deleted successfully`);
      },
      error: (err) => {
        console.error('Error deleting task:', err);
        // Revertir cambios en caso de error
        this.fieldSubject.next(field);
      }
    });
  }
}
