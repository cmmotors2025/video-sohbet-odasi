const USER_ID_KEY = 'video_room_user_id';
const USERNAME_KEY = 'video_room_username';

export const generateUserId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const getUsername = (): string => {
  return localStorage.getItem(USERNAME_KEY) || '';
};

export const setUsername = (username: string): void => {
  localStorage.setItem(USERNAME_KEY, username);
};

export const generateRoomCode = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};
