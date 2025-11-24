import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import { enviroment } from '../../../../../enviroment/enviroment';


interface PreviewField {
  id: number;
  image_url: string;
  title: string;
}
interface CropStatus {
  id: number;
  status: 'Healthy' | 'Attention' | 'Critical';
}
interface CropField {
  id: number;
  title: string;
  days: string;
}
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

  private baseUrl = enviroment.BASE_URL;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const previewFields$ = this.http.get<PreviewField[]>(`${this.baseUrl}/preview_fields`);
    const cropStatus$ = this.http.get<CropStatus[]>(`${this.baseUrl}/crop_status`);
    const cropFields$ = this.http.get<CropField[]>(`${this.baseUrl}/crop_fields`);

    this.fields$ = forkJoin([previewFields$, cropStatus$, cropFields$]).pipe(
      map(([previews, statuses, crops]) => {
        return previews.map(preview => {
          const status = statuses.find(s => s.id === preview.id);
          const crop = crops.find(c => c.id === preview.id);

          return {
            id: preview.id,
            image_url: preview.image_url,
            title: preview.title,
            status: status ? status.status : 'Unknown',
            cropName: crop ? crop.title : '',
            days: crop ? crop.days : '0'
          };
        });
      })
    );
  }
}
