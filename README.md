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

// Using QueryBuilder to build a request
const query = new QueryBuilder()
  .select(['name', 'age'])
  .where({ status: 'active' })
  .limit(10);

client.get('/users', query)
  .then(data => console.log(data))
  .catch(err => console.error(err));
```
