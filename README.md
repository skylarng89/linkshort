# LinkShort

Author: Patrick Aziken

## Overview
A URL shortening service built with Vue 3 + Composition API + SFC for the frontend, and Node.js + Express for the backend. Uses PostgreSQL for persistent storage and Redis for caching.

## Core Features
- Basic link shortening
- Custom back-halves
- Bulk link shortening
- Link redirects with change capability
- Link expiration
- Permanent links by default

## Project Structure
- `/frontend` for Vue app
- `/backend` for Node.js server
- `/database` for SQL scripts and migrations

## Setup Instructions
1. Clone the repository
2. Install dependencies in `/frontend` and `/backend`
3. Configure database and Redis connections
4. Run the backend server and frontend app

## Versioning and Releases
This project uses [Semantic Versioning (SemVer)](http://semver.org/) for its releases.
Release versions (e.g., `v1.0.0`, `v1.0.1-beta.1`) are managed automatically using [semantic-release](https://github.com/semantic-release/semantic-release) based on [Conventional Commits](https://www.conventionalcommits.org/).

- **Releases**: New versions are automatically released to GitHub when changes are merged into the `main` branch.
- **Changelog**: A `CHANGELOG.md` is automatically generated for each package (`backend/CHANGELOG.md`, etc.) with each release.
- **Development Branch**: The `dev` branch is used for ongoing development. Pull requests should be made against `dev`.
- **Commit Messages**: Please follow the commit conventions outlined in [CONTRIBUTING.md](CONTRIBUTING.md).

## License
MIT License
