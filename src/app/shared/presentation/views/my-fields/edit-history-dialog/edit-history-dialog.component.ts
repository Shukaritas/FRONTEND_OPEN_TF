import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface EditHistoryData {
  watered?: string | Date | null;
  fertilized?: string | Date | null;
  pests?: string | Date | null;
}

@Component({
  selector: 'app-edit-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './edit-history-dialog.component.html',
  styleUrls: ['./edit-history-dialog.component.css']
})
export class EditHistoryDialogComponent {
  public wateredStr: string = '';
  public fertilizedStr: string = '';
  public pestsStr: string = '';

  constructor(
    private dialogRef: MatDialogRef<EditHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditHistoryData
  ) {
    // Initialize strings from incoming data (ISO->DD/MM/YYYY or keep DD/MM/YYYY)
    const toDDMMYYYY = (v?: string | Date | null) => {
      if (!v) return '';
      const s = typeof v === 'string' ? v : new Date(v).toISOString();
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) { const [, y, mm, dd] = m; return `${dd}/${mm}/${y}`; }
      return s;
    };
    this.wateredStr = toDDMMYYYY(data?.watered ?? null);
    this.fertilizedStr = toDDMMYYYY(data?.fertilized ?? null);
    this.pestsStr = toDDMMYYYY(data?.pests ?? null);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private parseDDMMYYYY(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10) - 1;
    const year = parseInt(yyyy, 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  onSave(): void {
    const watered = this.wateredStr ? this.parseDDMMYYYY(this.wateredStr) : null;
    const fertilized = this.fertilizedStr ? this.parseDDMMYYYY(this.fertilizedStr) : null;
    const pests = this.pestsStr ? this.parseDDMMYYYY(this.pestsStr) : null;

    const result: EditHistoryData = {
      watered,
      fertilized,
      pests
    };
    this.dialogRef.close(result);
  }
}
