# DevOps

DevOps project with developer tool use. This branch includes a GitLab CI/CD starter for the repo.

## GitLab

This repository can also run as a GitLab CI/CD project through [.gitlab-ci.yml](.gitlab-ci.yml).

The pipeline has three parts:

1. `frontend-ci` installs dependencies with `npm ci`, then runs lint and build checks in `frontend/`.
2. `backend-ci` installs the locked Python dependencies with `uv sync`, then runs Django tests and deploy checks in `backend/`.
3. `build-and-push` runs only on pushes to `main` after the test jobs pass, then builds and pushes the backend, frontend, and proxy Docker images.

To use it in GitLab, add these CI/CD variables in your project settings:

1. `DOCKERHUB_USERNAME`
2. `DOCKERHUB_TOKEN`
3. `VITE_CLIENT_ID`

The backend job uses SQLite during CI, so it does not need a separate database service for the test stage. The Docker build stage uses Docker-in-Docker so the images can be published from the pipeline.
