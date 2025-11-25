import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../domain/model/task.entity';
import { TaskAssembler } from '../domain/model/task.assembler';
import {enviroment} from '../../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private taskUrl = enviroment.BASE_URL + enviroment.ENDPOINT_PATH_TASK;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {

    return this.http.get<any[]>(this.taskUrl).pipe(
      map(response => {
        return TaskAssembler.toEntitiesFromResponse(response);
      })
    );
  }

  // Nuevo método: obtener tareas por fieldId
  getTasksByFieldId(fieldId: number): Observable<Task[]> {
    const url = `${this.taskUrl}/field/${fieldId}`;
    return this.http.get<any[]>(url).pipe(
      map(response => TaskAssembler.toEntitiesFromResponse(response))
    );
  }
}
