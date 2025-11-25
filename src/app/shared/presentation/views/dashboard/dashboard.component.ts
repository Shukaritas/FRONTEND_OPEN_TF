import {Component, OnInit, OnDestroy} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of } from 'rxjs';
import { filter, switchMap, map } from 'rxjs/operators';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { FieldService } from '../../../../plants/field/services/field.services';
import { CropService } from '../../../../plants/crop/services/crop.services';
import { TaskService } from '../../../../plants/services/task.services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatIcon,
    MatCheckbox, MatIconButton, TranslateModule, FormsModule, RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Tarjetas de cultivos (map de Field -> objeto simple para la vista)
  crops: { id: number; name: string; image: string; }[] = [];
  // Mantener estructura existente para evitar romper plantilla (pero vacíos para estados vacíos)
  harvestDate: { dayName: string; dayNumber: number | null; harvests: any[] } = { dayName: '', dayNumber: null, harvests: [] };
  tasks: any[] = []; // Estados vacíos por ahora
  recommendations: any[] = []; // Estados vacíos por ahora
  private routerSubscription!: Subscription;

  constructor(
    private fieldService: FieldService,
    private cropService: CropService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();

    // Recargar al navegar nuevamente al dashboard (mantener lógica existente)
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.startsWith('/dashboard')) {
        this.loadData();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
  }

  loadData() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) { this.router.navigate(['/login']); return; }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) { this.router.navigate(['/login']); return; }

    // Día actual
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayKeys = ['DAYS.SUNDAY','DAYS.MONDAY','DAYS.TUESDAY','DAYS.WEDNESDAY','DAYS.THURSDAY','DAYS.FRIDAY','DAYS.SATURDAY'];
    this.harvestDate.dayName = dayKeys[today.getDay()];
    this.harvestDate.dayNumber = today.getDate();

    this.fieldService.getFieldsByUserId(userId).pipe(
      switchMap(fields => {
        // Mapear crops (tarjetas de campos)
        this.crops = fields.map(field => ({ id: field.id, name: field.name, image: field.image_url || '' }));

        if (fields.length === 0) {
          return of({ harvests: [], tasks: [] });
        }

        // Observables de cultivos por campo para próximas cosechas
        const cropObservables = fields.map(field => this.cropService.getCropByFieldId(field.id).pipe(
          map(crop => ({ field, crop }))
        ));
        const harvests$ = forkJoin(cropObservables).pipe(
          map((fieldCropPairs: { field: any; crop: any }[]) => {
            const upcoming: { when: string; location: string; crop: string }[] = fieldCropPairs.filter(({ crop }) => {
              if (!crop) return false;
              const rawHarvest = (crop as any).harvestDate || crop.harvest_date;
              if (!rawHarvest) return false;
              const dateObj = new Date(rawHarvest);
              if (isNaN(dateObj.getTime())) return false;
              dateObj.setHours(0,0,0,0);
              return dateObj.getTime() >= today.getTime();
            }).map(({ field, crop }) => {
              const rawHarvest = (crop as any).harvestDate || crop.harvest_date;
              const harvestDateObj = new Date(rawHarvest);
              harvestDateObj.setHours(0,0,0,0);
              const dd = String(harvestDateObj.getDate()).padStart(2,'0');
              const mm = String(harvestDateObj.getMonth()+1).padStart(2,'0');
              const yyyy = harvestDateObj.getFullYear();
              return {
                when: `${dd}/${mm}/${yyyy}`,
                location: field.name,
                crop: crop!.title || (crop as any).crop || ''
              };
            });
            upcoming.sort((a, b) => {
              const [ad, am, ay] = a.when.split('/').map(n => parseInt(n,10));
              const [bd, bm, by] = b.when.split('/').map(n => parseInt(n,10));
              return new Date(ay, am-1, ad).getTime() - new Date(by, bm-1, bd).getTime();
            });
            return upcoming.slice(0,2); // Solo las 2 más cercanas
          })
        );

        // Observables de tareas por campo (próximas tareas)
        const tasksObservables = fields.map(field => this.taskService.getTasksByFieldId(field.id).pipe(
          map(tasks => tasks.map(t => ({ task: t, fieldName: field.name })))
        ));
        const tasks$ = forkJoin(tasksObservables).pipe(
          map(grouped => grouped.flat()),
          map(list => {
            // Helper para parsear fecha (acepta ISO y 'YYYY-MM-DD')
            const parseDate = (value: string): Date => {
              if (!value) return new Date('');
              // Si es formato simple YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [y,m,d] = value.split('-').map(n => parseInt(n,10));
                return new Date(y, m-1, d);
              }
              const dt = new Date(value);
              return dt;
            };
            const filtered = list.filter(({ task }) => {
              const rawDue = task.due_date;
              if (!rawDue) return false;
              const dueObj = parseDate(rawDue);
              if (isNaN(dueObj.getTime())) return false;
              dueObj.setHours(0,0,0,0);
              return dueObj.getTime() >= today.getTime(); // Próximas (hoy o futuro)
            }).map(({ task, fieldName }) => {
              const rawDue = task.due_date;
              const dueObj = parseDate(rawDue); dueObj.setHours(0,0,0,0);
              const isToday = dueObj.getTime() === today.getTime();
              return {
                id: task.id,
                description: task.description,
                field: fieldName,
                date: rawDue,
                isToday: isToday
              };
            });
            // Orden ascendente (más cercana primero)
            filtered.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
            return filtered.slice(0,3); // 3 más próximas
          })
        );

        return forkJoin({ harvests: harvests$, tasks: tasks$ });
      })
    ).subscribe({
      next: ({ harvests, tasks }) => {
        this.harvestDate.harvests = harvests;
        this.tasks = tasks;
      },
      error: err => {
        console.error('Error cargando datos del dashboard', err);
        this.harvestDate.harvests = [];
        this.tasks = [];
      }
    });
  }

  // Mantener métodos usados en plantilla, sin llamadas HTTP directas
  deleteTask(id: number, event: MouseEvent) {
    event.stopPropagation();
    // Sin backend aún: eliminar localmente si existiera
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  toggleTask(task: any) {
    task.completed = !task.completed;
  }
}
