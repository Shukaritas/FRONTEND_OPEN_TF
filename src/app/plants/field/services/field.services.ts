import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Field } from '../domain/model/field.entity';
import { FieldAssembler } from '../domain/model/field.assembler';
import {enviroment} from '../../../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class FieldService {

  private fieldUrl = enviroment.BASE_URL + enviroment.ENDPOINT_PATH_FIELDS;

  constructor(private http: HttpClient) {}

  getFields(): Observable<Field[]> {
    return this.http.get<any[]>(this.fieldUrl).pipe(
      map(response => FieldAssembler.toEntitiesFromResponse(response))
    );
  }

  createField(field: Omit<Field, 'id'>): Observable<Field> {
    return this.http.post<Field>(this.fieldUrl, field);
  }

  deleteField(id: number): Observable<{}> {
    const url = `${this.fieldUrl}/${id}`;
    return this.http.delete(url);
  }

  updateField(field: Field): Observable<Field> {
    const url = `${this.fieldUrl}/${field.id}`;
    return this.http.put<Field>(url, field);
  }
}
