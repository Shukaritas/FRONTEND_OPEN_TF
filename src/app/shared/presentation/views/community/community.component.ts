import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Community } from '../../../../plants/community_recommendations/domain/model/community.entity';
import { CommunityService } from '../../../../plants/community_recommendations/services/community.services';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntil } from 'rxjs/operators';
import { UserEventsService } from '../../../infrastructure/services/user-events.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css']
})
export class CommunityComponent implements OnInit, OnDestroy {

  public recommendations$!: Observable<Community[]>; // Observable expuesto para plantilla
  private recommendationsSubject = new BehaviorSubject<Community[]>([]); // Estado interno mutable
  public newComment: string = '';
  public isFormVisible: boolean = false;
  private currentUserId: number | null = null;
  private destroy$ = new Subject<void>();
  private pendingNameChange: {oldName: string; newName: string} | null = null;

  constructor(private communityService: CommunityService, private userEvents: UserEventsService) {}

  ngOnInit(): void {
    const userIdStr = localStorage.getItem('userId');
    this.currentUserId = userIdStr ? parseInt(userIdStr, 10) : null;
    this.recommendations$ = this.recommendationsSubject.asObservable();
    this.loadRecommendations();
    this.userEvents.userNameChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        // Si aún no tenemos lista cargada, marcar como pendiente
        if (this.recommendationsSubject.value.length === 0) {
          this.pendingNameChange = payload;
        } else {
          this.applyNameChange(payload.oldName, payload.newName);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRecommendations() {
    this.communityService.getCommunityRecommendations().subscribe({
      next: list => {
        this.recommendationsSubject.next(list);
        // Aplicar cambio de nombre pendiente si existe
        if (this.pendingNameChange) {
          this.applyNameChange(this.pendingNameChange.oldName, this.pendingNameChange.newName);
          this.pendingNameChange = null;
        }
      },
      error: err => console.error('Error cargando recomendaciones', err)
    });
  }

  private applyNameChange(oldName: string, newName: string) {
    if (!newName) return;
    const current = this.recommendationsSubject.value.map(item => {
      // Actualizar si coincide por userId (preferente) o por nombre antiguo
      if ((this.currentUserId && item.userId === this.currentUserId) || item.user === oldName) {
        item = { ...item, user: newName };
      }
      return item;
    });
    this.recommendationsSubject.next(current);
  }

  toggleForm() {
    this.isFormVisible = !this.isFormVisible;
  }

  postRecommendation() {
    const trimmed = this.newComment.trim();
    if (!trimmed) return;
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) return;
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) return;

    this.communityService.createRecommendation(userId, trimmed).subscribe({
      next: created => {
        // Añadir nueva recomendación al estado local sin recargar toda la lista
        this.recommendationsSubject.next([...this.recommendationsSubject.value, created]);
        this.newComment = '';
        this.isFormVisible = false;
      },
      error: err => console.error('Error creando recomendación', err)
    });
  }
}
