import {User} from './profile.entity';


export class UserAssembler {
  public static toEntityFromResource(resource: any): User {
    const user = new User();
    user.id = resource.id;
    user.userName = resource.userName;
    user.email = resource.email;
    user.phoneNumber = resource.phoneNumber;
    user.identificator = resource.identificator;
    user.password = resource.password;
    return user;
  }

  public static toResourceFromEntity(user: User): any {
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      identificator: user.identificator,
      password: user.password
    };
  }
}
