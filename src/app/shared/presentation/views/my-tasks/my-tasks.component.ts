import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, forkJoin, of, switchMap, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Task } from '../../../../plants/task/domain/model/task.entity';
import { TaskService } from '../../../../plants/task/services/task.services';
import { FieldService } from '../../../../plants/field/services/field.services';
import { TranslatePipe } from '@ngx-translate/core';
import { TaskDialogComponent } from '../my-fields/task-dialog/task-dialog.component';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [ CommonModule, MatIconModule, MatButtonModule, TranslatePipe, MatDialogModule ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  constructor(
    private taskService: TaskService,
    private fieldService: FieldService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    // Proteger acceso a localStorage en SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.tasksSubject.next([]);
      return;
    }

    // 1. Obtener userId del localStorage
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      console.error('No userId found in localStorage');
      this.tasksSubject.next([]);
      return;
    }
    const userId = parseInt(userIdStr, 10);

    // 2. Obtener campos del usuario
    this.fieldService.getFieldsByUserId(userId).pipe(
      switchMap(fields => {
        // 3. Si no hay campos, retornar array vacío
        if (!fields || fields.length === 0) {
          return of([]);
        }

        // 4. Por cada campo, obtener sus tareas
        const taskRequests = fields.map(field =>
          this.taskService.getTasksByFieldId(field.id).pipe(
            map(tasks => {
              // 5. Mapeo: Añadir el nombre del campo a cada tarea
              return tasks.map(task => ({
                ...task,
                field: field.name  // Asignar el nombre del campo
              }));
            })
          )
        );

        // 6. Ejecutar todas las peticiones en paralelo
        return forkJoin(taskRequests);
      }),
      map(tasksArrays => {
        // 7. Aplanar el array de arrays a una sola lista
        return tasksArrays.flat();
      })
    ).subscribe({
      next: (tasks) => {
        this.tasksSubject.next(tasks);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.tasksSubject.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  // Helper: Convertir fecha ISO a DD/MM/YYYY para mostrar
  private formatDateToDDMMYYYY(isoDate: string): string {
    if (!isoDate) return '';
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Helper: Convertir DD/MM/YYYY a formato ISO para backend
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
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      alert('Fecha inválida.');
      return originalIso || '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();

    const dynamicTask: any = task as any;
    const fieldIdResolved: number | null =
      (typeof dynamicTask.fieldId === 'number' ? dynamicTask.fieldId : null) ??
      (typeof dynamicTask.field_id === 'number' ? dynamicTask.field_id : null);

    if (fieldIdResolved == null) {
      alert('Error: No se puede identificar el campo de esta tarea');
      return;
    }

    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: {
        description: task.description,
        dueDate: task.due_date,
        field: (task as any).field || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return; // cancelado
      if (!result.dueDateIso) return; // formato inválido no se cerró correctamente

      const payload: { fieldId: number; description: string; dueDate: string } = {
        fieldId: fieldIdResolved,
        description: result.description?.trim() || task.description,
        dueDate: result.dueDateIso
      };

      // Optimistic update
      const optimisticTasks = this.tasksSubject.getValue().map(t =>
        t.id === task.id ? { ...t, description: payload.description, due_date: payload.dueDate } : t
      );
      this.tasksSubject.next(optimisticTasks);
      this.cdr.detectChanges();

      this.taskService.updateTaskByPayload(task.id, payload).subscribe({
        next: (response) => {
          const finalTasks = this.tasksSubject.getValue().map(t =>
            t.id === task.id ? { ...t, description: response.description || payload.description, due_date: response.dueDate || response.due_date || payload.dueDate } : t
          );
          this.tasksSubject.next(finalTasks);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error actualizando tarea:', err);
          // revertir
          const reverted = this.tasksSubject.getValue().map(t =>
            t.id === task.id ? { ...t, description: task.description, due_date: task.due_date } : t
          );
          this.tasksSubject.next(reverted);
          this.cdr.detectChanges();
        }
      });
    });
  }

  deleteTask(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar esta tarea?')) return;

    const originalTasks = this.tasksSubject.getValue();
    // Optimista: quitar de la vista
    this.tasksSubject.next(originalTasks.filter(t => t.id !== id));
    this.cdr.detectChanges();

    this.taskService.deleteTask(id).subscribe({
      next: () => {
        alert('Tarea eliminada');
      },
      error: err => {
        console.error('Error eliminando tarea:', err);
        alert('No se pudo eliminar la tarea');
        // Revertir
        this.tasksSubject.next(originalTasks);
        this.cdr.detectChanges();
      }
    });
  }
}
