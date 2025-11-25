import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Community } from '../domain/model/community.entity';
import { CommunityAssembler } from '../domain/model/community.assembler';
import {enviroment} from '../../../../enviroment/enviroment';


@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  private communityUrl = enviroment.BASE_URL + enviroment.ENDPOINT_PATH_COMMUNITY_RECOMMENDATION;

  constructor(private http: HttpClient) {}


  getCommunityRecommendations(): Observable<Community[]> {
    return this.http.get<any[]>(this.communityUrl).pipe(
      map(response => {
        return CommunityAssembler.toEntitiesFromResponse(response);
      })
    );
  }

  createRecommendation(userId: number, comment: string): Observable<Community> {
    const payload = { userId, comment };
    return this.http.post<any>(this.communityUrl, payload).pipe(
      map(response => CommunityAssembler.toEntityFromResource(response))
    );
  }
}
