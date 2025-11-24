import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../domain/model/task.entity';
import { TaskAssembler } from '../domain/model/task.assembler';
import {enviroment} from '../../../../enviroment/enviroment';


@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private taskUrl = enviroment.BASE_URL + enviroment.ENDPOINT_PATH_TASK;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<any[]>(this.taskUrl).pipe(
      map(response => TaskAssembler.toEntitiesFromResponse(response))
    );
  }


  createTask(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http.post<Task>(this.taskUrl, task);
  }

  deleteTask(id: number): Observable<{}> {
    const url = `${this.taskUrl}/${id}`;
    return this.http.delete(url);
  }

  updateTask(task: Task): Observable<Task> {
    const url = `${this.taskUrl}/${task.id}`;
    return this.http.put<Task>(url, task);
  }

  // Nuevo: actualizar con payload camelCase específico del backend
  updateTaskByPayload(id: number, payload: { fieldId: number; description: string; dueDate: string }): Observable<any> {
    const url = `${this.taskUrl}/${id}`;
    return this.http.put<any>(url, payload);
  }

  getTasksByFieldId(fieldId: number): Observable<Task[]> {
    const url = `${this.taskUrl}/field/${fieldId}`;
    return this.http.get<any[]>(url).pipe(
      map(response => TaskAssembler.toEntitiesFromResponse(response))
    );
  }

}
