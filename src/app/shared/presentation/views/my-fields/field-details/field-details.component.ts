import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, switchMap, forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { enviroment } from '../../../../../../enviroment/enviroment';

export interface Task { id: number; description: string; due_date: string; field: string; }
export interface Field {
  id: number; name: string; image_url: string; product: string; location: string;
  field_size: string; crop: string; days_since_planting: string; planting_date: string;
  expecting_harvest: string; "Soil Type": string; watering: string; sunlight: string;
  status: string; progress_history: { watered: string; fertilized: string; pests: string; }[];
  tasks: { id: number; date: string; name: string; task: string; }[];
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

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        return this.http.get<Field>(`${this.baseUrl}/fields/${id}`);
      })
    ).subscribe(fieldData => {
      this.fieldSubject.next(fieldData);
    });
  }

  editHistory(field: Field) {
    const currentHistory = field.progress_history && field.progress_history.length > 0
      ? field.progress_history[0]
      : { watered: '', fertilized: '', pests: '' };

    const newWatered = prompt("Enter new watered date:", currentHistory.watered);
    const newFertilized = prompt("Enter new fertilized date:", currentHistory.fertilized);
    const newPests = prompt("Enter new pest inspection date:", currentHistory.pests);

    const updatedHistory = {
      watered: newWatered !== null ? newWatered : currentHistory.watered,
      fertilized: newFertilized !== null ? newFertilized : currentHistory.fertilized,
      pests: newPests !== null ? newPests : currentHistory.pests
    };

    const updatedField = { ...field, progress_history: [updatedHistory] };

    this.http.put<Field>(`${this.baseUrl}/fields/${field.id}`, updatedField).subscribe(response => {
      this.fieldSubject.next(response);
      alert('History updated successfully!');
    });
  }

  addTask(field: Field) {
    const newDescription = prompt("Enter the new task description:");
    const newDueDate = prompt("Enter the due date (e.g., DD/MM/YYYY):");

    if (!newDescription || !newDueDate) {
      alert("Both description and due date are required.");
      return;
    }

    const rootTask = { description: newDescription, due_date: newDueDate, field: field.name };

    this.http.post<Task>(`${this.baseUrl}/task`, rootTask).pipe(
      switchMap(createdTask => {
        const nestedTask = {
          id: createdTask.id,
          date: createdTask.due_date,
          name: field.name,
          task: createdTask.description
        };
        const existingTasks = Array.isArray(field.tasks) ? field.tasks : [];
        const updatedField = { ...field, tasks: [...existingTasks, nestedTask] };

        return this.http.put<Field>(`${this.baseUrl}/fields/${field.id}`, updatedField);
      })
    ).subscribe(finalUpdatedField => {
      this.fieldSubject.next(finalUpdatedField);
      alert('Task added successfully!');
    });
  }

  deleteTask(field: Field, taskId: number, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) { return; }
    const deleteFromRoot$ = this.http.delete(`${this.baseUrl}/task/${taskId}`);
    const updatedTasks = field.tasks.filter(task => task.id !== taskId);
    const updatedField = { ...field, tasks: updatedTasks };
    const updateField$ = this.http.put(`${this.baseUrl}/fields/${field.id}`, updatedField);
    forkJoin([deleteFromRoot$, updateField$]).subscribe({
      next: () => {
        this.fieldSubject.next(updatedField);
        console.log(`Task with ID: ${taskId} was deleted successfully.`);
      },
      error: (err) => {
        console.error('Error deleting task:', err);
        this.fieldSubject.next(field);
      }
    });
  }
}
