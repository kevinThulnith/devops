pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    booleanParam(
      name: 'DEPLOY',
      defaultValue: false,
      description: 'Deploy stack after successful checks (main branch only)'
    )
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/jenkins']],
          userRemoteConfigs: scm.userRemoteConfigs
        ])
      }
    }

    stage('Load Env File') {
      steps {
        withCredentials([file(credentialsId: 'fms-env', variable: 'ENV_FILE')]) {
          sh 'cp "$ENV_FILE" .env'
        }
      }
    }

    stage('Frontend Lint') {
      steps {
        sh '''
          set -e
          tar -C frontend --exclude=node_modules --exclude=dist -cf - . | docker run --rm -i node:20-alpine sh -lc '
            set -e
            mkdir -p /app
            tar -xf - -C /app
            cd /app
            if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
              npm ci --prefer-offline --no-audit --no-fund
            else
              npm install --prefer-offline --no-audit --no-fund
            fi
            npm run lint
          '
        '''
      }
    }

    stage('Backend Validate') {
      steps {
        sh '''
          set -e
          export DOCKER_BUILDKIT=1
          export COMPOSE_DOCKER_CLI_BUILD=1
          docker compose build --pull fms-prod-backend
          docker compose up -d fms-prod-database fms-prod-redis
          docker compose run --rm --no-deps fms-prod-backend sh -c "
            /app/.venv/bin/python manage.py check &&
            /app/.venv/bin/python manage.py migrate --noinput
          "
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          set -e
          export DOCKER_BUILDKIT=1
          export COMPOSE_DOCKER_CLI_BUILD=1
          docker compose build --pull fms-prod-frontend fms-prod-proxy
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          set -e
          docker compose up -d fms-prod-backend fms-prod-frontend fms-prod-proxy

          backend_ready=0
          for i in $(seq 1 45); do
            if docker compose exec -T fms-prod-backend wget --quiet --tries=1 --spider http://127.0.0.1:8000/api/health/; then
              backend_ready=1
              break
            fi
            sleep 2
          done

          if [ "$backend_ready" -ne 1 ]; then
            echo "Backend health check failed"
            docker compose ps
            docker compose logs --no-color fms-prod-backend || true
            exit 1
          fi

          for i in $(seq 1 30); do
            if docker compose exec -T fms-prod-proxy wget --quiet --tries=1 --spider http://127.0.0.1/health/; then
              echo "Health check passed"
              exit 0
            fi
            sleep 2
          done

          echo "Health check failed"
          docker compose ps
          docker compose logs --no-color fms-prod-proxy fms-prod-backend || true
          exit 1
        '''
      }
    }

    stage('Deploy') {
      when {
        allOf {
          branch 'main'
          expression { return params.DEPLOY }
        }
      }
      steps {
        sh '''
          export DOCKER_BUILDKIT=1
          export COMPOSE_DOCKER_CLI_BUILD=1
          docker compose up -d --build
        '''
      }
    }
  }

  post {
    always {
      sh 'docker compose logs --no-color > compose.log || true'
      archiveArtifacts artifacts: 'compose.log', allowEmptyArchive: true
      sh '''
        if [ "$BRANCH_NAME" = "main" ] && [ "$DEPLOY" = "true" ]; then
          echo "DEPLOY=true on main branch: leaving stack running"
        else
          docker compose down -v || true
        fi
      '''
      sh 'rm -f .env || true'
    }
  }
}
