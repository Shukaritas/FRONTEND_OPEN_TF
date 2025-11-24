import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Crop } from '../domain/model/crop.entity';
import { CropAssembler } from '../domain/model/crop.assembler';
import {enviroment} from '../../../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class CropService {

  private cropUrl = enviroment.BASE_URL + enviroment.ENDPOINT_PATH_CROP_FIELDS;

  constructor(private http: HttpClient) {}

  getCrops(): Observable<Crop[]> {
    return this.http.get<any[]>(this.cropUrl).pipe(
      map(response => CropAssembler.toEntitiesFromResponse(response))
    );
  }

  getCropByFieldId(fieldId: number): Observable<Crop | null> {
    const url = `${this.cropUrl}/field/${fieldId}`;
    return this.http.get<any>(url).pipe(
      map(response => response ? CropAssembler.toEntityFromResource(response) : null),
      catchError(() => of(null))
    );
  }

  createCrop(crop: Omit<Crop, 'id'>): Observable<Crop> {
    return this.http.post<Crop>(this.cropUrl, crop);
  }

  deleteCrop(id: number): Observable<{}> {
    const url = `${this.cropUrl}/${id}`;
    return this.http.delete(url);
  }

  updateCrop(crop: Crop): Observable<Crop> {
    const url = `${this.cropUrl}/${crop.id}`;
    return this.http.put<Crop>(url, crop);
  }
}
