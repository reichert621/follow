import { get, post } from './http';
import { ILocation, formatLocation } from './locations';

export interface IUser {
  id?: number;
  username: string;
  email: string;
  locations?: ILocation[];
}

export const fetchCurrentUser = (): Promise<IUser> => {
  return get('/api/me')
    .then(res => res.currentUser);
};

export const findByUsername = (username: string): Promise<IUser> => {
  return get(`/api/users/${username}`)
    .then(res => res.user);
};

export const fetchUserProfile = (username: string): Promise<any> => {
  return get(`/api/users/${username}/profile`)
    .then(result => {
      const { locations = [] } = result;

      return {
        ...result,
        locations: locations.map(formatLocation)
      };
    });
};

export const fetchFriends = (): Promise<IUser[]> => {
  return get('/api/friends')
    .then(res => res.friends);
};

export const fetchActiveUsers = (): Promise<IUser[]> => {
  return get('/api/users/all')
    .then(res => res.users);
};

export const followByUsername = (username: string): Promise<boolean> => {
  return post(`/api/users/${username}/follow`)
    .then(res => res.success);
};

export const unfollowByUsername = (username: string): Promise<boolean> => {
  return post(`/api/users/${username}/unfollow`)
    .then(res => res.success);
};

export const toggleFollowByUsername = (
  username: string,
  shouldFollow: boolean
): Promise<boolean> => {
  return shouldFollow
    ? followByUsername(username)
    : unfollowByUsername(username);
};
