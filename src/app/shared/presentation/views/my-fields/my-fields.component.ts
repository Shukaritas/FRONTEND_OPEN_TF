import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { forkJoin, map, Observable, switchMap, of } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Proteger acceso a localStorage en SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.fields$ = of([]);
      return;
    }

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

        const enrichedFields$ = fields.map(field =>
          this.cropService.getCropByFieldId(field.id).pipe(
            map(crop => {
              // Cálculo de días restantes hasta la cosecha
              let days = '0';
              if (crop) {
                const rawHarvest = (crop as any).harvestDate || crop.harvest_date;
                if (rawHarvest) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const harvestDate = new Date(rawHarvest);
                  if (!isNaN(harvestDate.getTime())) {
                    harvestDate.setHours(0, 0, 0, 0);
                    const diffTime = harvestDate.getTime() - today.getTime(); // Futuro - Hoy
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) diffDays = 0; // Ya pasó la fecha
                    days = diffDays.toString();
                  }
                }
              }

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

        return forkJoin(enrichedFields$);
      })
    );
  }
}
