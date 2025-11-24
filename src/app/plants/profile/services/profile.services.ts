import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { enviroment } from '../../../../enviroment/enviroment';
import { User } from '../domain/model/profile.entity';
import { UserAssembler } from '../domain/model/profile.assembler';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userUrl = `${enviroment.BASE_URL}${enviroment.ENDPOINT_PATH_USER}`;

  constructor(private http: HttpClient) {}

  // Método existente
  getUserById(id: number): Observable<User> {
    const url = `${this.userUrl}/${id}`;
    return this.http.get<any>(url).pipe(
      map(response => UserAssembler.toEntityFromResource(response))
    );
  }

  // NUEVO: Para validar el Login por correo
  getUserByEmail(email: string): Observable<User | null> {
    // Json-server permite filtrar por query params
    const url = `${this.userUrl}?email=${email}`;
    return this.http.get<any[]>(url).pipe(
      map(response => {
        if (response && response.length > 0) {
          return UserAssembler.toEntityFromResource(response[0]);
        }
        return null;
      })
    );
  }

  // NUEVO: Para el Registro
  createUser(user: User): Observable<User> {
    return this.http.post<any>(this.userUrl, user).pipe(
      map(response => UserAssembler.toEntityFromResource(response))
    );
  }

  // Método existente
  updateUser(user: User): Observable<User> {
    const url = `${this.userUrl}/${user.id}`;
    return this.http.put<User>(url, user);
  }

  // Método existente
  deleteAccountData(id: number): Observable<User> {
    const url = `${this.userUrl}/${id}`;
    const clearedUser = {
      id: id,
      user_name: "",
      email: "",
      phone_number: "",
      identificator: "",
      password: ""
    };
    return this.http.put<User>(url, clearedUser);
  }
}
