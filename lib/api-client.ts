/**
 * API Client for making requests to the backend
 * This file provides type-safe API calls for all backend endpoints
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new APIError(
      data.error || 'An error occurred',
      response.status,
      data
    )
  }

  return data
}

// Authentication
export const auth = {
  register: (data: {
    email: string
    password: string
    name: string
    role: 'SELLER' | 'BUYER'
    companyName?: string
    inviteCode?: string
  }) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyInvite: (code: string) =>
    fetchAPI(`/auth/verify-invite?code=${code}`),
}

// Campaigns
export const campaigns = {
  list: (params?: { status?: string }) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return fetchAPI(`/campaigns${query}`)
  },

  get: (id: string) => fetchAPI(`/campaigns/${id}`),

  create: (data: {
    categoryId: string
    name: string
    description?: string
    pricePerLead: number
    distributionLogic: string
    allowStateSelection?: boolean
  }) => fetchAPI('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => fetchAPI(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => fetchAPI(`/campaigns/${id}`, {
    method: 'DELETE',
  }),

  subscribe: (data: {
    campaignId: string
    dailyCap?: number
    states?: string[]
    waterfallPriority?: number
  }) => fetchAPI('/campaigns/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  unsubscribe: (subscriptionId: string) =>
    fetchAPI(`/campaigns/subscribe?id=${subscriptionId}`, {
      method: 'DELETE',
    }),
}

// Categories
export const categories = {
  list: () => fetchAPI('/categories'),

  get: (id: string) => fetchAPI(`/categories/${id}`),

  create: (data: { name: string; description?: string; fields: any[] }) =>
    fetchAPI('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) => fetchAPI(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => fetchAPI(`/categories/${id}`, {
    method: 'DELETE',
  }),
}

// Buyers
export const buyers = {
  list: (params?: { status?: string }) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return fetchAPI(`/buyers${query}`)
  },

  get: (id: string) => fetchAPI(`/buyers/${id}`),

  create: (data: {
    email: string
    password: string
    name: string
    companyName?: string
    priority?: number
  }) => fetchAPI('/buyers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => fetchAPI(`/buyers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => fetchAPI(`/buyers/${id}`, {
    method: 'DELETE',
  }),
}

// Leads
export const leads = {
  list: (params?: {
    status?: string
    category?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return fetchAPI(`/leads${query}`)
  },

  ingest: (
    data: {
      campaignId: string
      categoryId: string
      state?: string
      quality?: string
      data: any
    },
    apiKey: string
  ) =>
    fetchAPI('/leads/ingest', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'X-API-Key': apiKey,
      },
    }),
}

// Payments
export const payments = {
  methods: {
    list: () => fetchAPI('/payments/methods'),

    add: (data: { paymentMethodId: string; setAsPrimary?: boolean }) =>
      fetchAPI('/payments/methods', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    setPrimary: (id: string) =>
      fetchAPI('/payments/methods', {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId: id }),
      }),

    remove: (id: string) =>
      fetchAPI(`/payments/methods?id=${id}`, {
        method: 'DELETE',
      }),
  },

  wallet: {
    get: () => fetchAPI('/payments/wallet'),

    addFunds: (data: {
      amount: number
      paymentMethodId?: string
      isAutoRecharge?: boolean
    }) =>
      fetchAPI('/payments/wallet', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateAutoRecharge: (data: {
      autoRechargeEnabled?: boolean
      autoRechargeThreshold?: number
      autoRechargeAmount?: number
    }) =>
      fetchAPI('/payments/wallet', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  setupIntent: () => fetchAPI('/payments/setup-intent', { method: 'POST' }),
}

// Notifications
export const notifications = {
  getPreferences: () => fetchAPI('/notifications/preferences'),

  updatePreferences: (data: {
    emailOnLead?: boolean
    smsOnLead?: boolean
    webhookEnabled?: boolean
    webhookUrl?: string
    emailNotifications?: any
  }) =>
    fetchAPI('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Sellers
export const sellers = {
  connect: {
    create: () => fetchAPI('/sellers/connect', { method: 'POST' }),

    getStatus: () => fetchAPI('/sellers/connect'),

    dashboard: () => fetchAPI('/sellers/dashboard', { method: 'POST' }),
  },

  payouts: {
    get: (params?: { period?: string; startDate?: string; endDate?: string }) => {
      const query = params ? `?${new URLSearchParams(params)}` : ''
      return fetchAPI(`/sellers/payouts${query}`)
    },
  },

  subscription: {
    get: () => fetchAPI('/sellers/subscription'),

    create: (data: { tier: string; paymentMethodId: string }) =>
      fetchAPI('/sellers/subscription', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (immediate?: boolean) =>
      fetchAPI(`/sellers/subscription?immediate=${immediate || false}`, {
        method: 'DELETE',
      }),
  },
}

// Reports
export const reports = {
  get: (params: {
    type: string
    days?: number
    startDate?: string
    endDate?: string
  }) => {
    const query = new URLSearchParams(params as any)
    return fetchAPI(`/reports?${query}`)
  },
}
