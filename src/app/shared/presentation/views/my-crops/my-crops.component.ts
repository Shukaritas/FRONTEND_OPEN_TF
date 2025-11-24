import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, forkJoin, switchMap, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Crop } from '../../../../plants/crop/domain/model/crop.entity';
import { CropService } from '../../../../plants/crop/services/crop.services';
import { TranslatePipe } from '@ngx-translate/core';
import {CropFormComponent} from './my-crops-form/my-crops-form.component';
import { enviroment } from '../../../../../enviroment/enviroment';

export interface Field {
  id: number;
  name: string;
  crop: string;
  product: string;
  planting_date: string;
  expecting_harvest: string;
}

@Component({
  selector: 'app-my-crops',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    CropFormComponent,
    TranslatePipe
  ],
  templateUrl: './my-crops.component.html',
  styleUrls: ['./my-crops.component.css']
})
export class MyCropsComponent implements OnInit {

  private cropsSubject = new BehaviorSubject<Crop[]>([]);
  public crops$: Observable<Crop[]> = this.cropsSubject.asObservable();
  public showNewCropForm = false;
  private baseUrl = enviroment.BASE_URL;

  constructor(
    private cropService: CropService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cropService.getCrops().subscribe((crops: Crop[]) => {
      this.cropsSubject.next(crops);
      this.cdr.detectChanges();
    });
  }

  handleCropCreated({ cropData, fieldId }: { cropData: Omit<Crop, 'id'>, fieldId: number }): void {
    this.http.get<Field>(`${this.baseUrl}/fields/${fieldId}`).pipe(
      switchMap(selectedField => {
        const updatedFieldData = {
          ...selectedField,
          crop: cropData.title,
          product: cropData.title,
          planting_date: cropData.planting_date,
          expecting_harvest: cropData.harvest_date
        };

        const cropToCreate: Omit<Crop, 'id'> = {
          ...cropData,
          field: selectedField.name
        };

        const createCrop$ = this.cropService.createCrop(cropToCreate);
        const updateField$ = this.http.put<Field>(`${this.baseUrl}/fields/${fieldId}`, updatedFieldData);

        return forkJoin({ createdCrop: createCrop$, updatedField: updateField$ });
      })
    ).subscribe({
      next: ({ createdCrop }) => {
        const currentCrops = this.cropsSubject.getValue();
        this.cropsSubject.next([...currentCrops, createdCrop]);
        this.showNewCropForm = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error creating crop and updating field', err)
    });
  }

  deleteCrop(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this crop?')) return;

    const cropToDelete = this.cropsSubject.getValue().find(c => c.id === id);
    if (!cropToDelete) return;

    const deleteCrop$ = this.cropService.deleteCrop(id);
    const updateFields$ = this.http.get<Field[]>(`${this.baseUrl}/fields`).pipe(
      switchMap(fields => {
        const fieldsToUpdate = fields.filter(f => f.crop === cropToDelete.title);
        if (fieldsToUpdate.length === 0) return of([]);

        const updateCalls = fieldsToUpdate.map(field => {
          const updatedField = { ...field, crop: '', product: '', planting_date: '', expecting_harvest: '' };
          return this.http.put(`${this.baseUrl}/fields/${field.id}`, updatedField);
        });
        return forkJoin(updateCalls);
      })
    );

    forkJoin([deleteCrop$, updateFields$]).subscribe({
      next: () => {
        const updatedCrops = this.cropsSubject.getValue().filter(crop => crop.id !== id);
        this.cropsSubject.next(updatedCrops);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(`Error deleting crop ${id}`, err)
    });
  }

  editCrop(crop: Crop, event: Event): void {
    event.stopPropagation();
    const newTitle = prompt('Enter the new title:', crop.title);
    if (!newTitle || newTitle === crop.title) return;

    const oldTitle = crop.title;
    const updatedCropData: Crop = { ...crop, title: newTitle };

    const updateCrop$ = this.cropService.updateCrop(updatedCropData);

    const updateFields$ = this.http.get<Field[]>(`${this.baseUrl}/fields`).pipe(
      switchMap(fields => {
        const fieldsToUpdate = fields.filter(f => f.crop === oldTitle);
        if (fieldsToUpdate.length === 0) return of([]);

        const updateCalls = fieldsToUpdate.map(field => {
          const updatedField = { ...field, crop: newTitle, product: newTitle };
          return this.http.put(`${this.baseUrl}/fields/${field.id}`, updatedField);
        });
        return forkJoin(updateCalls);
      })
    );

    forkJoin([updateCrop$, updateFields$]).subscribe({
      next: ([updatedCrop]) => {
        const updatedCrops = this.cropsSubject.getValue().map(c => c.id === updatedCrop.id ? updatedCrop : c);
        this.cropsSubject.next(updatedCrops);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(`Error updating crop ${crop.id}`, err)
    });
  }
}
