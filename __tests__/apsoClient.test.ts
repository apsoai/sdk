import { ApsoClientFactory, QueryBuilder } from '../src/apsoClient';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// global.fetch = jest.fn(() =>
//   Promise.resolve({
//     ok: true,
//     json: () => Promise.resolve({ test: 100 }),
//   }),
// ) as jest.Mock;
describe('Apso SDK Client', () => {
  
  // jest.mock('axios');
  const config = {
    baseURL: 'https://api.example.com',
    apiKey: 'test-api-key',
    client: 'axios' as const
  };
  
  const client = ApsoClientFactory.getClient(config);
  const mock = new MockAdapter(axios);

  afterEach(() => {
    mock.reset();
  });

  test('GET request with where and limit', async () => {
    mock.onGet('/HopperLoads?filter[status]=active&limit=10').reply(200, { data: 'mockData' });

    const data = await client.entity('HopperLoads').where({ status: 'active' }).limit(10).get();
    expect(data).toEqual({ data: 'mockData' });
  });

  test('GET request with join and orderBy', async () => {
    mock.onGet('/HopperLoads?join=relatedEntity&sort[created_at]=ASC').reply(200, { data: 'mockData' });

    const data = await client.entity('HopperLoads').join(['relatedEntity']).orderBy({ created_at: 'ASC' }).get();
    expect(data).toEqual({ data: 'mockData' });
  });

  test('POST request with data', async () => {
    mock.onPost('/HopperLoads', { name: 'New Load' }).reply(201, { data: 'createdData' });

    const data = await client.entity('HopperLoads').post({ name: 'New Load' });
    expect(data).toEqual({ data: 'createdData' });
  });

  test('PUT request with data', async () => {
    mock.onPut('/HopperLoads', { name: 'Updated Load' }).reply(200, { data: 'updatedData' });

    const data = await client.entity('HopperLoads').put({ name: 'Updated Load' });
    expect(data).toEqual({ data: 'updatedData' });
  });

  test('DELETE request', async () => {
    mock.onDelete('/HopperLoads').reply(200, { message: 'Deleted successfully' });

    const data = await client.entity('HopperLoads').delete();
    expect(data).toEqual({ message: 'Deleted successfully' });
  });

  test('GET request with offset and page', async () => {
    mock.onGet('/HopperLoads?offset=5&page=2').reply(200, { data: 'mockData' });

    const data = await client.entity('HopperLoads').offset(5).page(2).get();
    expect(data).toEqual({ data: 'mockData' });
  });

  //TODO: fix this test
  // test('GET request with select and cache', async () => {
  //   mock.onGet('/HopperLoads?fields=name,age&cache=true').reply(200, { data: 'mockData' });

  //   const data = await client.entity('HopperLoads').select(['name', 'age']).cache(true).get();
  //   expect(data).toEqual({ data: 'mockData' });
  // });
});
