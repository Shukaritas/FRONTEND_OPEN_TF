import {Community} from './community.entity'

export class CommunityAssembler {

  public static toEntityFromResource(resource: any): Community {
    const communityEntry = new Community();
    communityEntry.id = resource.id;
    communityEntry.user = resource.userName || resource.user || '';
    communityEntry.description = resource.comment || resource.description || '';
    communityEntry.userId = resource.userId ?? resource.user_id ?? undefined;
    return communityEntry;
  }

  /**
   * Convierte un arreglo de recursos de datos crudos a un arreglo de instancias de Community.
   * @param response - El arreglo de objetos de datos crudos.
   * @returns Un arreglo de instancias de Community.
   */
  public static toEntitiesFromResponse(response: any[]): Community[] {
    return response.map(resource => this.toEntityFromResource(resource));
  }
}
