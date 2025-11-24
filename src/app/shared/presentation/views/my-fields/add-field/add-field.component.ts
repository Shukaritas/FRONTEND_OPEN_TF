import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldService } from '../../../../../plants/field/services/field.services';

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
  isUploading: boolean = false;
  private defaultImageUrl = 'https://images.unsplash.com/photo-1563252523-99321318e32a?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

  constructor(
    private fieldService: FieldService,
    private router: Router
  ) {}

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

  /**
   * Convierte un archivo a formato Base64 (Data URL)
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Error al leer el archivo como Base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async onSave() {
    if (!this.fieldName || !this.location || !this.fieldSize) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Obtener userId de localStorage
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      alert('Usuario no autenticado. Por favor inicie sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      alert('ID de usuario inválido. Por favor inicie sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.isUploading = true;

    try {
      // Convertir imagen a Base64 si hay archivo seleccionado
      let imageBase64: string;
      if (this.imageFile) {
        imageBase64 = await this.fileToBase64(this.imageFile);
      } else {
        imageBase64 = this.defaultImageUrl;
      }

      // Construir objeto para enviar al backend
      const newField = {
        userId: userId,
        imageUrl: imageBase64,
        name: this.fieldName,
        location: this.location,
        fieldSize: this.fieldSize  // Usar camelCase para el backend
      };

      // Enviar directamente al backend
      this.fieldService.createField(newField).subscribe({
        next: () => {
          this.isUploading = false;
          alert('Campo creado exitosamente.');
          this.router.navigate(['/my-fields']);
        },
        error: (err) => {
          console.error('Error al crear campo:', err);
          this.isUploading = false;
          if (err.status === 400) {
            alert('Datos inválidos. Verifique que el userId sea correcto.');
          } else {
            alert('Error al crear el campo. Intente nuevamente.');
          }
        }
      });
    } catch (error) {
      console.error('Error al convertir imagen a Base64:', error);
      this.isUploading = false;
      alert('Error al procesar la imagen. Intente nuevamente.');
    }
  }
}
