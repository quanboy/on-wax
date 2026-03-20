import client from "./client";

export const getNowPlaying = async () => {
  const response = await client.get("/spotify/now-playing");
  return response.data;
};
