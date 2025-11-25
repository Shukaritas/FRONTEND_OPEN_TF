import { Component, EventEmitter, Output, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    TextFieldModule, TranslatePipe, MatSnackBarModule
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
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private showNotification(key: string, actionKey: string = 'NOTIFICATIONS.CLOSE', duration: number = 3000) {
    const action = this.translate.instant(actionKey);
    this.translate.get(key).subscribe(message => {
      this.snackBar.open(message, action, {
        duration,
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      });
    });
  }

  ngOnInit() {
    // Proteger acceso a localStorage en SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.fields$ = of([]);
      return;
    }

    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : null;
    if (!userId) {
      this.showNotification('AUTH.NO_SESSION');
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
      this.showNotification('CROPS.FORM_INCOMPLETE');
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
        this.cropCreated.emit();
        this.router.navigate(['/my-crops']).catch(() => {});
        this.showNotification('CROPS.CREATE_SUCCESS');
      },
      error: err => {
        console.error('Error creando cultivo', err);
        this.showNotification('CROPS.CREATE_ERROR');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/my-crops']).catch(() => {});
    this.showNotification('CROPS.CANCELLED');
  }
}
