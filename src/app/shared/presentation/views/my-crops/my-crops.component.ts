import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, forkJoin, switchMap, of, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Crop } from '../../../../plants/crop/domain/model/crop.entity';
import { CropService } from '../../../../plants/crop/services/crop.services';
import { TranslatePipe } from '@ngx-translate/core';
import { CropFormComponent } from './my-crops-form/my-crops-form.component';
import { EditCropDialogComponent, EditCropDialogData } from './edit-crop-dialog/edit-crop-dialog.component';
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
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCropsWithFields();
  }

  private loadCropsWithFields(): void {
    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : null;
    if (!userId) {
      console.error('No userId en sesión');
      this.cropsSubject.next([]);
      return;
    }

    // 1. Obtener campos del usuario
    this.http.get<any[]>(`${this.baseUrl}/fields/user/${userId}`).pipe(
      switchMap(fields => {
        if (!fields || fields.length === 0) return of([]);
        // 2. Por cada field obtener su crop (si existe)
        const requests = fields.map(field =>
          this.cropService.getCropByFieldId(field.id).pipe(
            map(crop => {
              if (!crop) return null;
              // Asignar el nombre del field directamente a crop.field
              return { ...crop, field: field.name } as Crop;
            })
          )
        );
        return forkJoin(requests).pipe(
          map(results => results.filter(c => c !== null) as Crop[])
        );
      })
    ).subscribe({
      next: (cropsConField: Crop[]) => {
        this.cropsSubject.next(cropsConField);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando cultivos:', err);
        this.cropsSubject.next([]);
        this.cdr.detectChanges();
      }
    });
  }

  private reloadCrops(): void { this.loadCropsWithFields(); }

  handleCropCreated(): void {
    this.showNewCropForm = false;
    this.reloadCrops();
  }

  editCrop(crop: Crop, event: Event): void {
    event.stopPropagation();

    // Abrir el diálogo de edición con los datos actuales
    const dialogRef = this.dialog.open(EditCropDialogComponent, {
      width: '450px',
      data: {
        title: crop.title,
        status: crop.status
      } as EditCropDialogData
    });

    // Suscribirse al resultado del diálogo
    dialogRef.afterClosed().subscribe(result => {
      // Si el usuario canceló, result será undefined
      if (!result) return;

      // Construir objeto actualizado con los datos del diálogo
      const updatedCrop: Crop = {
        id: crop.id,
        title: result.title.trim(),
        planting_date: crop.planting_date,
        harvest_date: crop.harvest_date,
        field: crop.field || '',
        status: result.status,
        days: crop.days || '0',
        soilType: crop.soilType,
        sunlight: crop.sunlight,
        watering: crop.watering
      };

      // Llamada al servicio para actualizar el cultivo
      this.cropService.updateCrop(updatedCrop).subscribe({
        next: () => {
          /*
           * CORRECCIÓN CRÍTICA - Bug de desaparición de datos:
           * NO reemplazamos el objeto completo con la respuesta del backend porque:
           * 1. La respuesta no incluye 'field' (nombre del campo) que calculamos en el frontend
           * 2. Podría no incluir todas las fechas y propiedades formateadas
           *
           * En su lugar, fusionamos solo los cambios que hicimos (title y status)
           * manteniendo todas las demás propiedades locales intactas.
           *
           * NOTA ARQUITECTURAL:
           * No es necesario hacer PUT a /fields para "actualizar el nombre del cultivo en el campo".
           * El backend usa una arquitectura relacional donde:
           * - La tabla 'crop_fields' almacena los datos del cultivo (title, status, fechas, etc.)
           * - La tabla 'fields' almacena los datos del campo físico (ubicación, tamaño, etc.)
           * - La relación se mantiene mediante fieldId en crop_fields
           *
           * Al actualizar el cultivo aquí, cualquier vista que consulte los cultivos asociados
           * a un campo (como FieldDetailsComponent) mostrará automáticamente el nuevo nombre
           * al recargar, ya que consulta directamente la tabla crop_fields actualizada.
           */
          const currentCrops = this.cropsSubject.getValue();
          const updatedList = currentCrops.map(c =>
            c.id === crop.id
              ? { ...c, title: result.title.trim(), status: result.status } // Solo actualizar lo que cambió
              : c
          );
          this.cropsSubject.next(updatedList);
          this.cdr.detectChanges();
          alert('Cultivo actualizado correctamente');
        },
        error: err => {
          console.error('Error actualizando cultivo:', err);
          alert('No se pudo actualizar el cultivo');
        }
      });
    });
  }

  deleteCrop(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar este cultivo?')) return;

    // Llamada simple al servicio sin actualizar fields
    this.cropService.deleteCrop(id).subscribe({
      next: () => {
        // Actualizar lista local removiendo el cultivo eliminado
        const updatedCrops = this.cropsSubject.getValue().filter(crop => crop.id !== id);
        this.cropsSubject.next(updatedCrops);
        this.cdr.detectChanges();
        alert('Cultivo eliminado correctamente');
      },
      error: err => {
        console.error(`Error eliminando cultivo ${id}:`, err);
        alert('No se pudo eliminar el cultivo');
      }
    });
  }
}
