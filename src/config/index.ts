export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000'),
  solana: {
    endpoint: process.env.SOLANA_RPC || 'http://localhost:8899',
    commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
    compute: {
      limit: parseInt(process.env.SOLANA_COMPUTE_UNIT_LIMIT || '600000'),
      price: parseInt(process.env.SOLANA_COMPUTE_UNIT_PRICE || '25000'),
    },
    fee: {
      market: parseInt(process.env.SOLANA_FEE_MARKET || '50000'),
      high: parseInt(process.env.SOLANA_FEE_HIGH || '30000'),
      medium: parseInt(process.env.SOLANA_FEE_MEDIUM || '20000'),
      low: parseInt(process.env.SOLANA_FEE_LOW || '10000'),
    },
    serverKey: process.env.SOLANA_SERVER_KEY,
  },
  database: {
    url: process.env.DATABASE_URI || 'sqlite://./db/dev.sqlite',
    type: process.env.DATABASE_DRIVER || 'sqlite',
  },
  logging: {
    level: process.env.LOGGING_LEVEL || 'info',
    pretty: JSON.parse(process.env.LOGGING_PRETTY || 'false'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  genai: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '1.3'),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
  },
  soltracker: {
    apiKey: process.env.SOLTRACKER_API_KEY,
  },
  collection: {
    mint: process.env.COLLECTION_MINT || 'So11111111111111111111111111111111111111112',
    externalUrl: process.env.COLLECTION_EXTERNAL_URL || 'https://thetati.fun',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    storage: {
      publicBucket: process.env.SUPABASE_PUBLIC_BUCKET || 'tati',
      privateBucket: process.env.SUPABASE_PRIVATE_BUCKET || 'tati-collection',
    },
  },
})
