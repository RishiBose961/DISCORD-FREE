const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('discordx_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  auth: {
    login: async (credentials: { emailOrUsername: string; password: string }) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(res);
    },
    register: async (userData: { username: string; email: string; password: string }) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Servers
  servers: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/servers`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE}/servers/${id}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (data: { name: string; description?: string }) => {
      const res = await fetch(`${API_BASE}/servers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    join: async (inviteCode: string) => {
      const res = await fetch(`${API_BASE}/servers/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ inviteCode })
      });
      return handleResponse(res);
    },
    leave: async (id: string) => {
      const res = await fetch(`${API_BASE}/servers/${id}/leave`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/servers/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Channels
  channels: {
    create: async (data: { serverId: string; name: string; type: string; topic?: string }) => {
      const res = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/channels/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Messages
  messages: {
    getByChannel: async (channelId: string) => {
      const res = await fetch(`${API_BASE}/messages/channel/${channelId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (data: { channelId: string; content: string }) => {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // User
  users: {
    updateProfile: async (data: { status?: string; customStatus?: string; avatarColor?: string }) => {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  }
};
