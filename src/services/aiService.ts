import axios from 'axios';

// Force HTTPS
axios.defaults.httpsAgent = true;
axios.defaults.validateStatus = (status) => status >= 200 && status < 300;

// HTTPS-only interceptor
axios.interceptors.request.use(config => {
  if (config.url && !config.url.startsWith('https://')) {
    config.url = 'https://' + config.url.replace(/^http:\/\//, '');
  }
  return config;
});

// Rest of AI dynamic provider code from subordinate
// ...
