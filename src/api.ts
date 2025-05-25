import axios from 'axios';

const api = axios.create({
  baseURL: 'http://194.110.54.189:8080',
});

export default api;