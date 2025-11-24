import {Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import {forkJoin, of, Subscription, switchMap} from 'rxjs';
import { filter } from 'rxjs/operators';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import { enviroment } from '../../../../../enviroment/enviroment';

interface PreviewField {
  id: number;
  image_url: string;
  title: string;
}

interface Field {
  id: number;
  name: string;
  image_url: string;
  product: string;
  location: string;
  field_size: string;
  crop: string;
  days_since_planting: string;
  planting_date: string;
  expecting_harvest: string;
  status: string;
  tasks: { id: number; date: string; name: string; task: string; }[];
}

interface UpcomingTask { id: number; date: string; name: string; task: string; }

interface Recommendation {
  id: number;
  title: string;
  content: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatIcon,
    MatCheckbox, MatIconButton, TranslateModule, FormsModule, RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  crops: any[] = [];
  fields: any[] = [];
  harvestDate: any = { dayName: 'Tuesday', dayNumber: 16, harvests: [] };
  tasks: any[] = [];
  recommendations: any[] = [];
  private routerSubscription!: Subscription;
  private baseUrl = enviroment.BASE_URL;

  constructor(
    private http: HttpClient,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.loadData();

    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.startsWith('/dashboard')) {
        this.zone.run(() => {
          this.loadData();
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadData() {
    this.http.get<PreviewField[]>(`${this.baseUrl}/preview_fields`).subscribe(data => {
      this.crops = data.map(field => ({
        id: field.id, name: field.title, nameKey: field.title.toUpperCase().replace(/ /g, '_'), image: field.image_url
      }));
    });
    this.http.get<Field[]>(`${this.baseUrl}/fields`).subscribe(data => {
      const today = new Date();
      const currentDayNumber = today.getDate();
      const dayKeys = [
        "DAYS.SUNDAY", "DAYS.MONDAY", "DAYS.TUESDAY", "DAYS.WEDNESDAY",
        "DAYS.THURSDAY", "DAYS.FRIDAY", "DAYS.SATURDAY"
      ];
      const currentDayKey = dayKeys[today.getDay()];
      this.harvestDate = {
        dayName: currentDayKey,
        dayNumber: currentDayNumber,
        harvests: data.slice(0, 2).map(field => ({
          id: field.id, when: field.planting_date, location: field.name,
          locationKey: field.name.toUpperCase().replace(/ /g, '_'), crop: field.crop,
          cropKey: field.crop.toUpperCase(),
        }))
      };
    });
    this.http.get<UpcomingTask[]>(`${this.baseUrl}/upcoming_tasks`).subscribe(data => {
      this.tasks = data.map(task => ({
        id: task.id, when: task.date === '07/10/2025' ? 'Today' : task.date,
        location: task.name, locationKey: task.name.toUpperCase().replace(/ /g, '_'),
        name: task.task, nameKey: task.task.toUpperCase().replace(/ /g, '_'), completed: false
      }));
    });
    this.http.get<Recommendation[]>(`${this.baseUrl}/recommendations`).subscribe(data => {
      this.recommendations = data.map(rec => ({
        id: rec.id, field: rec.title, fieldKey: rec.title.toUpperCase().replace(/ /g, '_'),
        advice: rec.content, adviceKey: rec.content.toUpperCase().replace(/ /g, '_'),
      }));
    });
  }

  deleteTask(id: number, event: MouseEvent) {
    event.stopPropagation();

    const deleteTask$ = this.http.delete(`${this.baseUrl}/task/${id}`);

    const deleteUpcomingTask$ = this.http.delete(`${this.baseUrl}/upcoming_tasks/${id}`);

    const updateField$ = this.http.get<Field[]>(`${this.baseUrl}/fields`).pipe(
      switchMap(fields => {
        const fieldToUpdate = fields.find(f => f.tasks && f.tasks.some(t => t.id === id));
        if (fieldToUpdate) {
          fieldToUpdate.tasks = fieldToUpdate.tasks.filter(t => t.id !== id);
          return this.http.put(`${this.baseUrl}/fields/${fieldToUpdate.id}`, fieldToUpdate);
        }
        return of(null);
      })
    );

    forkJoin([deleteTask$, deleteUpcomingTask$, updateField$]).subscribe({
      next: () => {
        console.log(`Tarea con ID: ${id} eliminada de todas las fuentes.`);
        this.tasks = this.tasks.filter(task => task.id !== id);
      },
      error: err => {
        console.error('Error al eliminar la tarea:', err);
      }
    });
  }

  toggleTask(task: any) {
    task.completed = !task.completed;
  }
}
