import { get, post } from './http';

export interface IUser {
  id?: number;
  username: string;
  email: string;
}

export const findByUsername = (username: string): Promise<IUser> => {
  return get(`/api/users/${username}`)
    .then(res => res.user);
};

export const fetchFollowStatus = (username: string): Promise<any> => {
  return get(`/api/users/${username}/status`);
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
