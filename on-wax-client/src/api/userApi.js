import client from './client';

export const getMyProfile = () => client.get('/users/me').then(r => r.data);
export const getMyBadges = () => client.get('/users/me/badges').then(r => r.data);
export const getProfile = (username) => client.get(`/users/${username}`).then(r => r.data);
export const getBadges = (username) => client.get(`/users/${username}/badges`).then(r => r.data);
export const getFollowers = (username) => client.get(`/users/${username}/followers`).then(r => r.data);
export const getFollowing = (username) => client.get(`/users/${username}/following`).then(r => r.data);
export const followUser = (username) => client.post(`/users/${username}/follow`).then(r => r.data);
export const unfollowUser = (username) => client.delete(`/users/${username}/follow`).then(r => r.data);
export const getFeed = () => client.get('/feed').then(r => r.data);
