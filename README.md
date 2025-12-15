# Planopia

Time tracking and leave management system for teams. Built with React and Node.js.

**Live:** [app.planopia.pl](https://app.planopia.pl)

## What it does

Planopia helps teams manage work hours and leave requests. Employees log daily hours, request time off, and supervisors approve requests. Everything is organized by departments within teams.

## Features

- **Time tracking** - Daily hour logging with monthly calendar view and PDF export
- **Leave management** - Request system with department-based approval workflows
- **Team organization** - Multi-tenant setup where each team has isolated data and departments
- **Role-based access** - Admin, HR, Department Supervisor, and Worker roles with different permissions
- **Multi-language** - Polish and English support

## Tech stack

**Frontend:**
- React 18 with Vite
- TanStack Query for data fetching
- FullCalendar for calendar views
- Tailwind CSS
- React Router

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Email notifications with Nodemailer

## Security

The app includes several security measures:

- **JWT authentication** with http-only cookies and refresh token rotation
- **Password hashing** using bcrypt with 12 salt rounds
- **Rate limiting** on login, password reset, and team registration endpoints
- **CSRF protection** for state-changing operations
- **XSS protection** with input sanitization
- **MongoDB injection protection** via query sanitization
- **Security headers** using Helmet
- **CORS** restricted to specific origins
- **Role-based access control** enforced on both frontend and backend

## Project structure

```
├── client/          # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/        # Custom React hooks
│       ├── context/      # Auth and alert context
│       └── utils/        # Helper functions
└── server/          # Node.js backend
    ├── controllers/      # Request handlers
    ├── models/          # Database schemas
    ├── routes/          # API endpoints
    └── middleware/      # Auth and validation
```

## License

MIT License
