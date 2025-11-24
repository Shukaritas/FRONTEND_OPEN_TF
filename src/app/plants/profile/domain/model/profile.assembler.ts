import {User} from './profile.entity';


export class UserAssembler {
  public static toEntityFromResource(resource: any): User {
    const user = new User();
    user.id = resource.id;
    user.user_name = resource.user_name;
    user.email = resource.email;
    user.phone_number = resource.phone_number;
    user.identificator = resource.identificator;
    user.password = resource.password;
    return user;
  }
}
