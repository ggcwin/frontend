import axios from 'axios';

const api = axios.create({
  // 🚀 Ab humara frontend direct Render wale LIVE backend se baat karega!
  baseURL: 'https://ggcwin-backend.onrender.com' 
});

export default api;