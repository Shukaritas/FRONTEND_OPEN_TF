import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export interface EditCropDialogData {
  title: string;
  status: string;
}

@Component({
  selector: 'app-edit-crop-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './edit-crop-dialog.component.html',
  styleUrls: ['./edit-crop-dialog.component.css']
})
export class EditCropDialogComponent {
  // Copia de los datos para no mutar directamente el objeto original
  data: EditCropDialogData;

  // Opciones de estado disponibles
  statuses: string[] = ['Healthy', 'Attention', 'Critical'];

  constructor(
    public dialogRef: MatDialogRef<EditCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public injectedData: EditCropDialogData
  ) {
    // Crear una copia de los datos recibidos
    this.data = { ...injectedData };
  }

  onCancel(): void {
    // Cerrar sin enviar datos (equivalente a cancelar)
    this.dialogRef.close();
  }

  onSave(): void {
    // Validación básica
    if (!this.data.title || !this.data.title.trim()) {
      alert('El nombre del cultivo no puede estar vacío');
      return;
    }

    if (!this.data.status) {
      alert('Debes seleccionar un estado');
      return;
    }

    // Cerrar enviando los datos actualizados
    this.dialogRef.close(this.data);
  }
}

