import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {TranslatePipe} from '@ngx-translate/core';
import {Community} from '../../../../plants/community_recommendations/domain/model/community.entity';
import {CommunityService} from '../../../../plants/community_recommendations/services/community.services';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css']
})
export class CommunityComponent implements OnInit {

  public recommendations$!: Observable<Community[]>;

  constructor(private communityService: CommunityService) {}

  ngOnInit(): void {
    this.recommendations$ = this.communityService.getCommunityRecommendations();
  }
}
