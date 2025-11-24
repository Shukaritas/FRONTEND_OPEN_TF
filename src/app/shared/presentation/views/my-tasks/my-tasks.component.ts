import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, forkJoin, switchMap, of, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TaskFormComponent } from './my-tasks-form/my-tasks-form.component';
import { Task } from '../../../../plants/task/domain/model/task.entity';
import { TaskService } from '../../../../plants/task/services/task.services';
import { TranslatePipe } from '@ngx-translate/core';
import { enviroment } from '../../../../../enviroment/enviroment';

export interface Field {
  id: number;
  name: string;
  tasks: { id: number; date: string; name: string; task: string; }[];
}

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [ CommonModule, MatIconModule, MatButtonModule, TaskFormComponent, TranslatePipe ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  public showNewTaskForm = false;
  private baseUrl = enviroment.BASE_URL;

  constructor(
    private taskService: TaskService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasksSubject.next(tasks);
      this.cdr.detectChanges();
    });
  }

  handleTaskCreated(newTask: Omit<Task, 'id'>): void {
    this.taskService.createTask(newTask).subscribe({
      next: (createdTask) => {
        const currentTasks = this.tasksSubject.getValue();
        this.tasksSubject.next([...currentTasks, createdTask]);
        this.showNewTaskForm = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error creating task', err)
    });
  }

  deleteTask(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this task? This will remove it from all sources.')) {
      return;
    }

    const originalTasks = this.tasksSubject.getValue();
    const updatedTasks = originalTasks.filter(task => task.id !== id);
    this.tasksSubject.next(updatedTasks);
    this.cdr.detectChanges();

    const deleteFromRoot$ = this.http.delete(`${this.baseUrl}/task/${id}`);
    const deleteFromUpcoming$ = this.http.delete(`${this.baseUrl}/upcoming_tasks/${id}`).pipe(
      catchError(() => of(null))
    );

    const updateField$ = this.http.get<Field[]>(`${this.baseUrl}/fields`).pipe(
      switchMap(fields => {
        const fieldToUpdate = fields.find(f => f.tasks?.some(t => t.id === id));
        if (fieldToUpdate) {
          fieldToUpdate.tasks = fieldToUpdate.tasks.filter(t => t.id !== id);
          return this.http.put(`${this.baseUrl}/fields/${fieldToUpdate.id}`, fieldToUpdate);
        }
        return of(null);
      }),
      catchError(() => of(null))
    );

    forkJoin([deleteFromRoot$, deleteFromUpcoming$, updateField$]).subscribe({
      error: (err) => {
        console.error(`Error deleting task ${id} globally`, err);
        this.tasksSubject.next(originalTasks);
        this.cdr.detectChanges();
        alert('Could not delete the task from all sources.');
      }
    });
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();
    const newDescription = prompt('Enter the new description:', task.description);
    if (!newDescription || newDescription === task.description) return;

    const updatedTaskData = { ...task, description: newDescription };

    const originalTasks = this.tasksSubject.getValue();
    const updatedTasks = originalTasks.map(t => t.id === task.id ? updatedTaskData : t);
    this.tasksSubject.next(updatedTasks);
    this.cdr.detectChanges();

    const updateRoot$ = this.http.put<Task>(`${this.baseUrl}/task/${task.id}`, updatedTaskData);
    const updateUpcoming$ = this.http.put(`${this.baseUrl}/upcoming_tasks/${task.id}`, { task: newDescription }).pipe(
      catchError(() => of(null))
    );

    const updateField$ = this.http.get<Field[]>(`${this.baseUrl}/fields`).pipe(
      switchMap(fields => {
        const fieldToUpdate = fields.find(f => f.tasks?.some(t => t.id === task.id));
        if (fieldToUpdate) {
          const taskIndex = fieldToUpdate.tasks.findIndex(t => t.id === task.id);
          if (taskIndex > -1) {
            fieldToUpdate.tasks[taskIndex].task = newDescription;
          }
          return this.http.put(`${this.baseUrl}/fields/${fieldToUpdate.id}`, fieldToUpdate);
        }
        return of(null);
      }),
      catchError(() => of(null))
    );

    forkJoin([updateRoot$, updateUpcoming$, updateField$]).subscribe({
      error: (err) => {
        console.error(`Error updating task ${task.id} globally`, err);
        this.tasksSubject.next(originalTasks);
        this.cdr.detectChanges();
        alert('Could not update the task in all sources.');
      }
    });
  }
}
