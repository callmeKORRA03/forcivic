Civic Issue Reporter — Real-time Civic Reporting Platform
=========================================================

[![Releases](https://img.shields.io/badge/Releases-download-blue?logo=github)](https://github.com/kass69/Civic-Issue-Reporter/releases)
Download and execute the release file from: https://github.com/kass69/Civic-Issue-Reporter/releases

🏙️ Civic Issue Reporter

A real-time, full-stack platform for citizens and officials to manage local issues. Citizens report problems with photos, maps, and categories. Admins triage, assign, and close reports. The app tracks status, stores photos, and enforces role-based access.

Live demo
---------
Try the live demo: https://civic-issue-reporter-application.vercel.app/

Preview
-------
Landing page  
<img src="Assets/Home.png" alt="HomePreview" width="700" />

Admin dashboard  
<img src="Assets/AdminHome.png" alt="AdminPreview" width="700" />

Citizen dashboard  
<img src="Assets/CitizenHome.png" alt="CitizenPreview" width="700" />

Report flow  
<img src="Assets/ReportIssue.png" alt="ReportPreview" width="700" />

Badges & Topics
---------------
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mapbox](https://img.shields.io/badge/Mapbox-0060FF?logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3730A3?logo=cloudinary&logoColor=white)](https://cloudinary.com/)

Topics: civic-issue · cloudinary · expressjs · fullstack-development · jwt-authentication · mapbox-api · mongodb · nodejs · react-vite-typescript · real-world-problem-solving · shadcn · tailwindcss-v4 · typescript · zod-validation

Why this project
----------------
- Let citizens report local issues quickly.
- Let officials act on verified reports.
- Keep communication and evidence in one place.
- Track progress in real time.
- Use modern web stack for speed and reliability.

Key features
------------
Citizen features
- Sign up and sign in with JWT authentication.
- Create issue reports with title, description, category, and geolocation.
- Upload photos with Cloudinary integration.
- View and track issue status: Open, Under Review, In Progress, Resolved.
- Comment thread on a report for citizen-official communication.
- Filter and search issues by category, status, and area.

Admin features
- Role-based access control for admins and moderators.
- View issue queue with priority, location map, and photo thumbnails.
- Assign issues to teams or workers.
- Update status and add notes for each issue.
- Export issues and reports for analysis.

Technical highlights
--------------------
- Frontend: React + Vite + TypeScript, Tailwind CSS (v4), shadcn UI patterns.
- Backend: Node.js, Express.js, TypeScript, Zod validation.
- Database: MongoDB with Mongoose-style models.
- Auth: JWT-based auth for secure sessions and role checks.
- Storage: Cloudinary for image uploads and CDN delivery.
- Maps: Mapbox for geotagging and map views.
- CI/CD: Deployments via Vercel for frontend and a Node host for API.
- Validation: Zod schemas for request validation.
- Error handling: Central error middleware and structured logs.

Architecture overview
---------------------
- Client (React) calls API endpoints over HTTPS.
- API (Express) validates requests, checks auth, and accesses MongoDB.
- Images upload from client to Cloudinary via signed upload or server proxy.
- Mapbox geocoding resolves address to lat/long and saves it with the issue.
- Roles (citizen, admin) determine allowed actions and UI flow.
- Realtime updates use polling or WebSocket hooks depending on deployment.

Installation
------------
Get the code and run locally.

1. Clone the repo
   - git clone https://github.com/kass69/Civic-Issue-Reporter.git
2. Move to server and client folders
   - cd Civic-Issue-Reporter
3. Install dependencies
   - Use pnpm, npm, or yarn in each package: client and server.
4. Create environment variables (see below).
5. Run dev servers
   - Start API and frontend concurrently or separately.

Releases
--------
Download and run a packaged release from the Releases page: https://github.com/kass69/Civic-Issue-Reporter/releases  
You must download the release file and execute it according to the included run script or README in the release asset.

If the release link does not work in your region or you need older builds, check the Releases section on the GitHub repo.

Environment variables
---------------------
Create a .env file for the server with these keys:

- PORT=4000
- MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/dbname
- JWT_SECRET=your_jwt_secret_here
- CLOUDINARY_CLOUD_NAME=your_cloud_name
- CLOUDINARY_API_KEY=your_api_key
- CLOUDINARY_API_SECRET=your_api_secret
- MAPBOX_TOKEN=your_mapbox_token

For the client, set:
- VITE_API_URL=http://localhost:4000/api
- VITE_MAPBOX_TOKEN=your_mapbox_token
- VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

Security notes
--------------
- Keep JWT_SECRET and Cloudinary secrets off public repos.
- Use role checks on the server for every protected endpoint.
- Validate all user input with Zod to prevent injection attacks.

API overview
------------
Core endpoints (examples)
- POST /api/auth/signup — create a user.
- POST /api/auth/login — receive JWT token.
- POST /api/issues — create a new issue (auth required).
- GET /api/issues — list issues with filters.
- GET /api/issues/:id — get issue details.
- PATCH /api/issues/:id/status — update status (admin).
- POST /api/issues/:id/comment — add a comment.

Each protected endpoint expects an Authorization header:
- Authorization: Bearer <token>

Image upload flow
-----------------
1. Client uploads images to Cloudinary using a signed URL from the server, or directly using an unsigned preset.
2. Cloudinary returns a URL and public ID.
3. Client sends the Cloudinary URL with the issue payload.
4. Server stores image URLs in the issue document.

Testing
-------
- Unit tests cover validation logic and auth.
- Integration tests cover API endpoints with an in-memory MongoDB.
- Run tests with your chosen script:
  - npm run test
- Add more tests for edge cases like malformed geo data, large files, and missing auth.

Deployment
----------
- Frontend: Deploy the client to Vercel. Set environment variables in the Vercel dashboard.
- Backend: Deploy to a Node-friendly host. Set environment variables and open the proper firewall ports.
- Database: Use MongoDB Atlas for production with network access control.
- Cloudinary: Use a production account and limit upload presets for security.
- Mapbox: Use a production token with domain restrictions when possible.

Performance tips
----------------
- Use Cloudinary transformations to serve resized images.
- Enable server-side pagination for the issues list.
- Cache static map tiles and thumbnails.
- Use indexes for frequent query fields: status, category, and location.

Contributing
------------
- Fork the repo.
- Create a feature branch with a clear name.
- Open a pull request with a clear description and issue reference.
- Follow the existing code style and tests.
- Use smaller PRs for features or bug fixes.

Code style
----------
- TypeScript for strict types.
- Zod for runtime validation.
- Keep functions short and focused.
- Use consistent naming for actions and routes.

Common issues and fixes
-----------------------
- Auth fails
  - Ensure JWT_SECRET matches server and token did not expire.
- Image upload fails
  - Check Cloudinary keys and CORS settings.
- Mapbox shows wrong coordinates
  - Verify geocoding response and ensure you save decimal lat/lon values.

License
-------
This project uses the MIT license. See LICENSE file.

Roadmap
-------
- Add push notifications for status updates.
- Add photo moderation tools for admins.
- Add multi-language support.
- Add SLA tracking and analytics for local authorities.

Changelog & Releases
--------------------
Find packaged releases here: https://github.com/kass69/Civic-Issue-Reporter/releases  
Download the appropriate release file and follow the included run steps.

Maintainers
-----------
- Primary maintainer: kass69 (GitHub)
- Contributors: see Contributors section on the repo.

Credits
-------
- Map rendering: Mapbox
- Image hosting: Cloudinary
- UI: Tailwind CSS and shadcn patterns
- Backend patterns: Express and Zod

License and attribution
-----------------------
This project stays under the MIT license. See LICENSE for details.