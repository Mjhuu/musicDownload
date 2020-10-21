import ajax from "./ajax";
const BASE_URL = 'https://api.mtnhao.com';

export const getSongDetail = (data) => ajax(BASE_URL + '/song/detail', data);
