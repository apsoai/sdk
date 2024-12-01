# Apso SDK

A TypeScript SDK for interacting with Apso services via their OpenAPI-compliant CRUD API.

## Installation

```bash
npm install @apsoai/sdk
```

## Usage
```typescript
import { ApsoClientFactory, QueryBuilder } from '@apsoai/sdk';

const config = {
  baseURL: 'https://api.apso-service.com',
  apiKey: 'your-api-key'
};

const client = ApsoClientFactory.getClient(config);

const activeUsers = await client.entity('users')
  .where({ status: 'active' })
  .limit(10)
  .get();


```
