import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Crop } from '../../../../../plants/crop/domain/model/crop.entity';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { enviroment } from '../../../../../../enviroment/enviroment';

export interface Field {
  id: number;
  name: string;
}

@Component({
  selector: 'app-crop-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './my-crops-form.component.html',
  styleUrls: ['./my-crops-form.component.css']
})
export class CropFormComponent implements OnInit {
  @Output() cropCreated = new EventEmitter<{ cropData: Omit<Crop, 'id'>, fieldId: number }>();
  @Output() cancel = new EventEmitter<void>();


  public newCrop: Partial<Crop> = {
    title: '',
    planting_date: '',
    harvest_date: '',
    status: 'Healthy'
  };
  public selectedFieldId: number | null = null;

  public fields$!: Observable<Field[]>;
  private baseUrl = enviroment.BASE_URL;
  public statuses: string[] = ['Healthy', 'Attention', 'Critical'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fields$ = this.http.get<Field[]>(`${this.baseUrl}/fields`);
  }

  onSubmit(): void {
    if (this.selectedFieldId && this.newCrop.title && this.newCrop.planting_date && this.newCrop.harvest_date) {
      const cropDataToSend: Omit<Crop, 'id'> = {
        title: this.newCrop.title,
        planting_date: this.newCrop.planting_date,
        harvest_date: this.newCrop.harvest_date,
        status: this.newCrop.status || 'Healthy',
        field: '',
        days: '0'
      };
      this.cropCreated.emit({ cropData: cropDataToSend, fieldId: this.selectedFieldId });
    } else {
      alert('Please fill all fields and select a field.');
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
