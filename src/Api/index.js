import ajax from "./ajax";
export const BASE_URL = 'http://192.168.0.200:83';

export const getSongDetail = (data) => ajax(BASE_URL + '/song/detail', data);
