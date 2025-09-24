# Payment Processing API

This is a **payment processing API** built with Node.js, TypeScript, and Express, integrated with **Dintero** payment gateway and **PostgreSQL** database.

## Project structure

```
├── app/
│   └── example/
│       ├── jest.config.json
│       ├── package.json
│       ├── tsconfig.build.json
│       ├── tsconfig.json
│       ├── migrations/
│       │   └── V0001__create_order_table.sql
│       ├── src/
│       │   ├── api.ts
│       │   ├── db.ts
│       │   ├── server.ts
│       │   ├── controllers/
│       │   │   └── orderController.ts
│       │   ├── integrations/
│       │   │   ├── index.ts
│       │   │   └── dintero/
│       │   │       ├── client.ts
│       │   │       ├── config.ts
│       │   │       ├── index.ts
│       │   │       └── types.ts
│       │   ├── mappers/
│       │   │   ├── orderMapper.ts
│       │   │   └── statusMapper.ts
│       │   ├── middleware/
│       │   │   └── validation.ts
│       │   ├── models/
│       │   │   ├── payment.ts
│       │   │   └── enums/
│       │   │       ├── dinteroStatus.ts
│       │   │       └── paymentStatus.ts
│       │   ├── routes/
│       │   │   └── orderRoutes.ts
│       │   ├── services/
│       │   │   └── paymentService.ts
│       │   └── validation/
│       │       └── paymentValidation.ts
│       └── test/
│           ├── setup.ts
│           ├── example/
│           │   └── simple.test.ts
│           └── unit/
│               ├── orderController.test.ts
│               ├── orderMapper.test.ts
│               ├── paymentService.test.ts
│               ├── paymentValidation.test.ts
│               └── validation.test.ts
├── tasks/
│   └── order-payment.md
├── biome.json
├── docker-compose.yml
├── Makefile
└── README.md
```

### API Endpoints:
- `POST /orders` - Create new payment order
- `GET /orders` - List all payment orders
- `GET /orders/:id/payment-redirect` - Handle payment redirect/status update

## Development

**Install dependencies**

```shell
yarn --cwd app/example/ install
```

**Run postgresl with docker-compose**

```shell
docker compose up
```

> The database have been configured to load SQL files from
> `app/example/migrations` during start, the database need to be
> restarted if the files are updated

```shell
docker compose down
docker compose up --detach
```

**Run development mode**

> The App restarts automatically when update is saved to `*.ts` files.

```shell
yarn --cwd app/example start
```

> The example API will then by default be running on port 3000


## API Testing

### Environment Variables
Before testing, make sure you have the required environment variables set in `.env` file.

### Basic API Testing with cURL

**1. Create a new payment order**
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "NOK",
    "receipt": "receipt-123"
  }'
```

Expected response:
```json
{
  "id": "uuid-here",
  "created_at": "2025-09-23T20:30:00.000Z",
  "amount": 10000,
  "currency": "NOK",
  "receipt": "receipt-123",
  "status": "PENDING",
  "links": [
    {
      "rel": "session_link",
      "href": "https://checkout.dintero.com/session/..."
    }
  ]
}
```

**2. List all payment orders**
```bash
curl -X GET http://localhost:3000/orders
```

Expected response:
```json
{
  "orders": [
    {
      "id": "uuid-here",
      "created_at": "2025-09-23T20:30:00.000Z",
      "amount": 10000,
      "currency": "NOK",
      "receipt": "receipt-123",
      "status": "PENDING"
    }
  ]
}
```

**3. Update payment status**
```bash
curl -X GET http://localhost:3000/orders/{order-id}/payment-redirect
```

Expected response:
```json
{
  "message": "Order updated successfully",
  "order": {
    "id": "uuid-here",
    "created_at": "2025-09-23T20:30:00.000Z",
    "amount": 10000,
    "currency": "NOK", 
    "receipt": "receipt-123",
    "status": "AUTHORIZED"
  }
}
```



