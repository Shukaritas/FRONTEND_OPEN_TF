import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserEventsService {
  private userNameChangedSubject = new Subject<{oldName: string; newName: string}>();
  userNameChanged$: Observable<{oldName: string; newName: string}> = this.userNameChangedSubject.asObservable();

  emitUserNameChanged(payload: {oldName: string; newName: string}) {
    this.userNameChangedSubject.next(payload);
  }
}
