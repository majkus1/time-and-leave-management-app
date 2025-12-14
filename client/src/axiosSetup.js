import axios from 'axios';
import { API_URL } from './config.js';

axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000; // 30 second default timeout for all requests

const fetchCsrfToken = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/csrf-token`, {
      withCredentials: true
    });
    axios.defaults.headers.common['X-CSRF-Token'] = res.data.csrfToken;
  } catch (err) {
    console.error('CSRF prefetch error:', err);
  }
};

fetchCsrfToken();

axios.interceptors.request.use(async config => {
  const method = config.method?.toLowerCase();
  const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method);

  if (needsCsrf) {
    config.headers = config.headers || {};
    if (!config.headers['X-CSRF-Token']) {
      try {
        const res = await axios.get(`${API_URL}/api/csrf-token`, {
          withCredentials: true
        });
        config.headers['X-CSRF-Token'] = res.data.csrfToken;
      } catch (err) {
        console.error('Interceptor CSRF fetch error:', err);
      }
    }
  }

  return config;
}, error => Promise.reject(error));

