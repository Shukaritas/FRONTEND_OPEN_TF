import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { FieldService } from '../../../../../plants/field/services/field.services';
import { CropService, CreateCropFieldRequest } from '../../../../../plants/crop/services/crop.services';
import { Router } from '@angular/router';
import { Crop } from '../../../../../plants/crop/domain/model/crop.entity';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslatePipe } from '@ngx-translate/core';

export interface Field {
  id: number;
  name: string;
}

@Component({
  selector: 'app-crop-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    TextFieldModule, TranslatePipe
  ],
  templateUrl: './my-crops-form.component.html',
  styleUrls: ['./my-crops-form.component.css']
})
export class CropFormComponent implements OnInit {
  @Output() cropCreated = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  public newCrop: Partial<Crop> = {
    title: '',
    planting_date: '',
    harvest_date: '',
    status: 'Healthy',
    soilType: '',
    sunlight: '',
    watering: ''
  };
  public selectedFieldId: number | null = null;

  public fields$!: Observable<Field[]>;
  public statuses: string[] = ['Healthy', 'Attention', 'Critical'];

  constructor(
    private fieldService: FieldService,
    private cropService: CropService,
    private router: Router
  ) {}

  ngOnInit() {
    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : null;
    if (!userId) {
      alert('No se encontró el usuario en sesión. Inicia sesión nuevamente.');
      this.fields$ = of([]);
      return;
    }
    this.fields$ = this.fieldService.getFieldsByUserId(userId);
  }

  private toIsoDate(dateStr: string): string {
    // dateStr viene en formato yyyy-MM-dd del input date HTML
    if (!dateStr) return '';
    return `${dateStr}T00:00:00`; // Suficiente para LocalDateTime en backend
  }

  onSubmit(): void {
    if (!this.selectedFieldId || !this.newCrop.title || !this.newCrop.planting_date || !this.newCrop.harvest_date) {
      alert('Por favor completa todos los campos y selecciona un field.');
      return;
    }

    const payload: CreateCropFieldRequest = {
      fieldId: this.selectedFieldId,
      crop: this.newCrop.title!,
      plantingDate: this.toIsoDate(this.newCrop.planting_date!),
      harvestDate: this.toIsoDate(this.newCrop.harvest_date!),
      status: (this.newCrop.status as 'Healthy' | 'Attention' | 'Critical') || 'Healthy',
      soilType: this.newCrop.soilType || '',
      sunlight: this.newCrop.sunlight || '',
      watering: this.newCrop.watering || ''
    };

    this.cropService.createCrop(payload).subscribe({
      next: () => {
        // Emitir evento para que el padre refresque lista o navegar
        this.cropCreated.emit();
        // Opcional: navegar a lista de cultivos
        this.router.navigate(['/my-crops']).catch(() => {});
      },
      error: err => {
        console.error('Error creando cultivo', err);
        alert('No se pudo crear el cultivo. Intenta nuevamente.');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/my-crops']).catch(() => {});
  }
}
