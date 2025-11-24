import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';
import {TranslatePipe} from '@ngx-translate/core';
import { enviroment } from '../../../../../../enviroment/enviroment';

@Component({
  selector: 'app-add-field',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './add-field.component.html',
  styleUrls: ['./add-field.component.css']
})
export class AddFieldComponent {
  fieldName: string = '';
  location: string = '';
  fieldSize: string = '';
  imageFile: File | null = null;
  imageUrl: string | ArrayBuffer | null = 'https://images.unsplash.com/photo-1563252523-99321318e32a?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  private baseUrl = enviroment.BASE_URL;

  constructor(private http: HttpClient, private router: Router) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  onSave() {
    if (!this.fieldName || !this.location || !this.fieldSize || !this.imageFile) {
      alert('Please fill all fields and upload an image.');
      return;
    }

    // --- OBJETO CORREGIDO ---
    const newField = {
      name: this.fieldName,
      location: this.location,
      field_size: this.fieldSize,
      image_url: this.imageUrl,
      product: '',
      crop: '',
      days_since_planting: '0',
      planting_date: '',
      expecting_harvest: '',
      "Soil Type": '',
      watering: '',
      sunlight: '',
      status: '',
      progress_history: [
        {
          "watered": "",
          "fertilized": "",
          "pests": ""
        }
      ],
      tasks: []
    };

    this.http.post<any>(`${this.baseUrl}/fields`, newField).pipe(
      switchMap(createdField => {
        const newPreview = {
          id: createdField.id,
          image_url: createdField.image_url,
          title: createdField.name
        };
        return this.http.post(`${this.baseUrl}/preview_fields`, newPreview);
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/my-fields']);
      },
      error: (err) => console.error('Error creating new field:', err)
    });
  }
}
