import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Crop } from '../domain/model/crop.entity';
import { CropAssembler } from '../domain/model/crop.assembler';
import {enviroment} from '../../../../enviroment/enviroment';

// DTO para creación de cultivos según backend
export interface CreateCropFieldRequest {
  fieldId: number;
  crop: string; // En el front normalmente llamado title
  plantingDate: string; // ISO (yyyy-MM-ddTHH:mm:ss)
  harvestDate: string; // ISO (yyyy-MM-ddTHH:mm:ss)
  status: 'Healthy' | 'Attention' | 'Critical';
  soilType?: string;
  sunlight?: string;
  watering?: string;
}

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

  createCrop(request: CreateCropFieldRequest): Observable<Crop> {
    return this.http.post<any>(this.cropUrl, request).pipe(
      map(response => CropAssembler.toEntityFromResource(response))
    );
  }

  deleteCrop(id: number): Observable<{}> {
    const url = `${this.cropUrl}/${id}`;
    return this.http.delete(url);
  }

  updateCrop(crop: Crop): Observable<Crop> {
    const url = `${this.cropUrl}/${crop.id}`;

    // Transformar el objeto local al formato que espera el backend
    // El frontend usa 'title' pero el backend espera 'crop'
    const payload = {
      crop: crop.title,  // Mapear title a crop
      status: crop.status,
      plantingDate: crop.planting_date,
      harvestDate: crop.harvest_date,
      soilType: crop.soilType,
      sunlight: crop.sunlight,
      watering: crop.watering
    };

    return this.http.put<any>(url, payload).pipe(
      map(response => CropAssembler.toEntityFromResource(response))
    );
  }
}
