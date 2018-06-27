import { get, post } from './http';
import { ILocation } from './locations';

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

export const fetchFollowStatus = (username: string): Promise<any> => {
  return get(`/api/users/${username}/status`);
};

export const fetchFriends = (): Promise<any> => {
  return get('/api/friends')
    .then(res => res.friends);
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
