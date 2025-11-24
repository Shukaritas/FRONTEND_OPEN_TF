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
  private storageUrl = `${enviroment.BASE_URL}/storage`;

  constructor(private http: HttpClient) {}

  getFields(): Observable<Field[]> {
    return this.http.get<any[]>(this.fieldUrl).pipe(
      map(response => FieldAssembler.toEntitiesFromResponse(response))
    );
  }

  getFieldsByUserId(userId: number): Observable<Field[]> {
    const url = `${this.fieldUrl}/user/${userId}`;
    return this.http.get<any[]>(url).pipe(
      map(response => FieldAssembler.toEntitiesFromResponse(response))
    );
  }

  createField(fieldPayload: any): Observable<Field> {
    return this.http.post<Field>(this.fieldUrl, fieldPayload);
  }

  deleteField(id: number): Observable<{}> {
    const url = `${this.fieldUrl}/${id}`;
    return this.http.delete(url);
  }

  updateField(field: Field): Observable<Field> {
    const url = `${this.fieldUrl}/${field.id}`;
    return this.http.put<Field>(url, field);
  }

  uploadImage(file: File): Observable<{fileUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{fileUrl: string}>(`${this.storageUrl}/upload`, formData);
  }
}
