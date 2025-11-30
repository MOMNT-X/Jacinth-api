<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Environment Variables

Copy `env.example` to `.env` and fill in all required environment variables:

```bash
$ cp env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - PostgreSQL direct connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SENDGRID_API_KEY` - SendGrid API key for email service
- `TWILIO_ACCOUNT_SID` - Twilio Account SID for SMS service
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` - Paystack credentials
- `FLUTTERWAVE_SECRET_KEY` / `FLUTTERWAVE_PUBLIC_KEY` - Flutterwave credentials
- `DISCORD_WEBHOOK_URL` - Discord webhook URL for notifications

## Database Setup

```bash
# Generate Prisma Client
$ npx prisma generate

# Run migrations
$ npx prisma migrate dev

# Or in production
$ npx prisma migrate deploy
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker Setup

### Development with Docker Compose

```bash
# Start all services (PostgreSQL + Backend)
$ docker-compose up -d

# View logs
$ docker-compose logs -f backend

# Stop services
$ docker-compose down

# Stop and remove volumes
$ docker-compose down -v
```

### Build Docker Image

```bash
# Build image
$ docker build -t jacinth-backend .

# Run container
$ docker run -p 3001:3001 --env-file .env jacinth-backend
```

## Features

- **Authentication**: JWT-based auth with email/SMS OTP verification
- **Email Service**: SendGrid integration for transactional emails
- **SMS Service**: Twilio integration for SMS OTP delivery
- **Payment Processing**: Paystack and Flutterwave integration
- **Product Management**: Full CRUD operations for products and categories
- **Shopping Cart**: Complete cart management system
- **Order Management**: Order creation and tracking
- **User Management**: Profile management and account operations

## API Endpoints

### Authentication
- `POST /auth/signup` - User signup
- `POST /auth/verify-otp` - Verify email OTP
- `POST /auth/send-phone-otp` - Send SMS OTP
- `POST /auth/verify-phone-otp` - Verify phone OTP
- `POST /auth/setup-account` - Complete account setup
- `POST /auth/login` - User login
- `POST /auth/reset-password` - Request password reset
- `POST /auth/reset-password-confirm` - Confirm password reset

### Products
- `GET /products` - List products (with pagination and filters)
- `GET /products/slug/:slug` - Get product by slug
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (protected)
- `PATCH /products/:id` - Update product (protected)
- `DELETE /products/:id` - Delete product (protected)

### Categories
- `GET /categories` - List all categories
- `GET /categories/slug/:slug` - Get category by slug with products
- `GET /categories/:id` - Get category by ID

### Cart
- `GET /cart` - Get user's cart (protected)
- `POST /cart/items` - Add item to cart (protected)
- `PATCH /cart/items/:id` - Update cart item (protected)
- `DELETE /cart/items/:id` - Remove item from cart (protected)
- `DELETE /cart` - Clear cart (protected)

### Orders
- `POST /orders` - Create order from cart (protected)
- `GET /orders` - Get user's orders (protected)
- `GET /orders/:id` - Get order by ID (protected)

### Payments
- `POST /payments/initialize` - Initialize payment (protected)
- `POST /payments/verify` - Verify payment (protected)
- `GET /payments/transactions` - Get transaction history (protected)
- `POST /payments/webhook/paystack` - Paystack webhook
- `POST /payments/webhook/flutterwave` - Flutterwave webhook

### Users
- `GET /users/me` - Get current user profile (protected)
- `PATCH /users/me` - Update profile (protected)
- `PATCH /users/me/password` - Change password (protected)
- `PATCH /users/me/email` - Request email update (protected)
- `PATCH /users/me/email/verify` - Verify email update (protected)
- `GET /users/me/stats` - Get user stats (protected)
- `PATCH /users/me/deactivate` - Deactivate account (protected)
- `DELETE /users/me` - Delete account (protected)

## Health Check

```bash
GET /health
```

Returns application health status and uptime.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# Jacinth-api
