# Flight Booking System

A comprehensive flight booking platform built with Next.js and Supabase, featuring advanced booking options, real-time updates, offline capabilities, and a rewarding loyalty program.

## Core Features

### User Management
- Secure authentication via Supabase Auth
- Profile management with booking history
- Personal and payment information storage
- Multi-device synchronization

### Flight Search
- Multiple booking types:
  - One-way flights
  - Round-trip bookings
  - Multi-city itineraries
- Advanced search filters:
  - Origin and destination
  - Flexible dates
  - Passenger types (adults, children, infants)
  - Cabin classes (Economy, Premium Economy, Business, First)
- Interactive fare calendar with price trends
- Smart flight recommendations
- Real-time seat availability

### Booking Management
- Comprehensive passenger information collection
- E-ticket generation and management
- Booking modifications and cancellations
- Real-time flight status updates via SSE
- Automated email notifications
- Multi-city booking support

### Loyalty Program
- Points accumulation system
- Tiered membership (Bronze, Silver, Gold, Platinum)
- Reward redemption options:
  - Cabin upgrades
  - Lounge access
  - Extra baggage
  - Priority boarding
  - Free flights
- Progress tracking and tier benefits

### Progressive Web App
- Offline functionality
- Background synchronization
- Push notifications
- App-like experience
- Automatic updates

## Technical Architecture

### Frontend
- **Framework**: Next.js with React
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Performance**:
  - Web Workers for CPU-intensive tasks
  - IndexedDB for offline data persistence
  - Service Workers for PWA features

### Backend (Supabase)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Functions**: Edge Functions

### Infrastructure
- **Containerization**: Docker
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt
- **Caching**: Redis (via Supabase)

### APIs and Services
- Server-Sent Events (SSE) for real-time updates
- RESTful APIs for data operations
- WebSocket connections for live data
- Background sync for offline operations

## Project Structure

```
flight-booking-system/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # App router pages and layouts
│   ├── components/             # Reusable UI components
│   │   ├── booking/           # Booking-related components
│   │   ├── flights/           # Flight search components
│   │   ├── loyalty/           # Loyalty program components
│   │   └── shared/            # Common UI components
│   ├── lib/                   # Core functionality
│   │   ├── services/         # Business logic services
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Helper functions
│   ├── public/               # Static assets and PWA files
│   │   ├── icons/           # App icons
│   │   ├── manifest.json    # PWA manifest
│   │   └── service-worker.js # Service worker
│   └── types/               # TypeScript definitions
├── supabase/                  # Backend configuration
│   ├── functions/            # Edge functions
│   └── migrations/           # Database migrations
├── nginx/                     # Nginx configuration
└── docs/                      # Documentation
    ├── api/                  # API documentation
    └── deployment/           # Deployment guides
```

## Getting Started

### Prerequisites
- Node.js 20.x or later
- Docker and Docker Compose
- Supabase CLI

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flight-booking-system.git
   cd flight-booking-system
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. Start the development environment:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   supabase db reset
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Production Deployment
1. Build the application:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Deploy:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Configuration

### Environment Variables

#### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret

#### Optional Variables
- `SMTP_HOST`: Email server host
- `SMTP_PORT`: Email server port
- `SMTP_USER`: Email account username
- `SMTP_PASS`: Email account password
- `REDIS_URL`: Redis connection string

### Security Configuration
- SSL/TLS certificates in `/nginx/ssl/`
- CORS configuration in Supabase dashboard
- Authentication settings in Supabase dashboard

## Development

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

### Building
```bash
# Development build
npm run build

# Production build
npm run build:prod

# Analyze bundle
npm run analyze
```

### Documentation
```bash
# Generate API documentation
npm run docs:api

# Serve documentation locally
npm run docs:serve
```

### API Documentation
The API is documented using OpenAPI 3.0 (Swagger) specification. You can find the complete API documentation in `/docs/api/openapi.yaml`.

#### Viewing API Documentation
1. Using Swagger UI (Recommended):
   ```bash
   # Install swagger-ui globally
   npm install -g swagger-ui-cli
   
   # Serve the documentation
   swagger-ui-cli serve docs/api/openapi.yaml
   ```
   Then open http://localhost:8080 in your browser.

2. Using Redoc:
   ```bash
   # Install redoc-cli globally
   npm install -g redoc-cli
   
   # Serve the documentation
   redoc-cli serve docs/api/openapi.yaml
   ```
   Then open http://localhost:8080 in your browser.

#### API Endpoints Overview
- **Flight Management**
  - Search flights with advanced filters
  - Real-time availability checks
  - Price and schedule information

- **Booking Operations**
  - Create and manage bookings
  - Support for one-way, round-trip, and multi-city
  - Passenger information handling

- **Loyalty Program**
  - Account management
  - Points tracking and redemption
  - Tier benefits

- **Real-time Updates**
  - Flight status via SSE
  - Live notifications
  - Status change tracking

## Contributing

### Development Process
1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```
4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation as needed
- Follow the existing code style

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Documentation review
4. Testing verification

## Support

- GitHub Issues for bug reports
- Discussions for feature requests
- Documentation for guides

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Supabase team for the excellent backend platform
- Next.js team for the frontend framework
- All contributors who have helped shape this project
