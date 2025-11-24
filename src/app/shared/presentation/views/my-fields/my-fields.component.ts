import { Component, OnInit } from '@angular/core';
import { forkJoin, map, Observable, switchMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldService } from '../../../../plants/field/services/field.services';
import { CropService } from '../../../../plants/crop/services/crop.services';


export interface CombinedField {
  id: number;
  image_url: string;
  title: string;
  status: 'Healthy' | 'Attention' | 'Critical' | 'Unknown';
  cropName: string;
  days: string;
}

@Component({
  selector: 'app-my-fields',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './my-fields.component.html',
  styleUrls: ['./my-fields.component.css']
})
export class MyFieldsComponent implements OnInit {

  public fields$!: Observable<CombinedField[]>;

  constructor(
    private fieldService: FieldService,
    private cropService: CropService,
    private router: Router
  ) {}

  ngOnInit() {
    // Paso 1: Obtener userId del localStorage
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      console.error('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;
    }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      console.error('ID de usuario inválido');
      this.router.navigate(['/login']);
      return;
    }

    // Paso 2: Obtener campos del usuario y enriquecerlos con información de cultivos
    this.fields$ = this.fieldService.getFieldsByUserId(userId).pipe(
      switchMap(fields => {
        if (fields.length === 0) {
          return of([]);
        }

        // Paso 3: Para cada campo, obtener su información de cultivo en paralelo
        const enrichedFields$ = fields.map(field =>
          this.cropService.getCropByFieldId(field.id).pipe(
            map(crop => {
              // Paso 4: Calcular días desde planting_date
              let days = '0';
              if (crop && crop.planting_date) {
                const plantingDate = new Date(crop.planting_date);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - plantingDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                days = diffDays.toString();
              }

              // Paso 5: Construir el objeto CombinedField
              const combinedField: CombinedField = {
                id: field.id,
                title: field.name,
                image_url: field.image_url,
                status: crop ? (crop.status as any) : 'Unknown',
                cropName: crop ? crop.title : '',
                days: days
              };
              return combinedField;
            })
          )
        );

        // Ejecutar todas las peticiones en paralelo
        return forkJoin(enrichedFields$);
      })
    );
  }
}
