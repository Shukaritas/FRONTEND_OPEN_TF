import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { enviroment } from '../../../../enviroment/enviroment';
import { User } from '../domain/model/profile.entity';
import { UserAssembler } from '../domain/model/profile.assembler';

interface LoginResponse {
  token: string;
  [key: string]: any; // Para campos adicionales que pueda devolver el backend
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userUrl = `${enviroment.BASE_URL}/users`; // CRUD base

  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<User> {
    const url = `${this.userUrl}/${id}`;
    return this.http.get<any>(url).pipe(
      map(response => UserAssembler.toEntityFromResource(response))
    );
  }

  // Nuevo login contra backend Spring Boot
  login(email: string, password: string): Observable<LoginResponse> {
    const url = `${enviroment.BASE_URL}/users/sign-in`;
    return this.http.post<LoginResponse>(url, { email, password });
  }

  // Registro contra backend Spring Boot
  createUser(user: User): Observable<User> {
    const url = `${enviroment.BASE_URL}/users/sign-up`;
    const body = UserAssembler.toResourceFromEntity(user);
    return this.http.post<any>(url, body).pipe(
      map(response => UserAssembler.toEntityFromResource(response))
    );
  }

  updateUser(user: User): Observable<User> {
    const url = `${this.userUrl}/${user.id}/profile`;
    const body = {
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber
    };
    return this.http.put<any>(url, body).pipe(
      map(response => UserAssembler.toEntityFromResource(response))
    );
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<void> {
    const url = `${this.userUrl}/${userId}/password`;
    const body = { currentPassword, newPassword };
    return this.http.put<void>(url, body);
  }

  deleteUser(id: number): Observable<void> {
    const url = `${this.userUrl}/${id}`;
    return this.http.delete<void>(url);
  }
}
