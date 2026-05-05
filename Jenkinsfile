// =============================================================================
// ParkSim OS — Jenkins CI/CD Pipeline (LOCAL + AWS VERSION)
// Full pipeline: Clone → Install → SonarQube Scan → Quality Gate →
//                Docker Build → Deploy to EC2
// =============================================================================

pipeline {
    agent any

    // ── Environment Variables ────────────────────────────────────────────────
    environment {
        // EC2_IP is set via Jenkins Credentials OR auto-read from .ec2-ip file
        EC2_IP      = credentials('EC2_PUBLIC_IP')   // Jenkins Credential: plain text
        SONAR_TOKEN = credentials('SONAR_TOKEN')     // Jenkins Credential: secret text
        APP_DIR     = '/home/ubuntu/parksim'
        COMPOSE_PROJECT_NAME = 'parksim'
        SONAR_HOST  = 'http://sonarqube:9000'        // SonarQube running in Docker
    }

    // ── Pipeline Options ─────────────────────────────────────────────────────
    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ── Stage 1: Clone ───────────────────────────────────────────────────
        stage('Clone Repository') {
            steps {
                echo '📦 Cloning repository from workspace...'
                checkout scm
            }
        }

        // ── Stage 2: Install Dependencies ────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing npm dependencies for all microservices...'
                sh '''
                    echo "→ API Gateway..."
                    cd backend/api-gateway && npm ci --prefer-offline && cd ../..
                    echo "→ User Service..."
                    cd backend/user-service && npm ci --prefer-offline && cd ../..
                    echo "→ Parking Service..."
                    cd backend/parking-service && npm ci --prefer-offline && cd ../..
                    echo "→ Notification Service..."
                    cd backend/notification-service && npm ci --prefer-offline && cd ../..
                    echo "✅ All dependencies installed!"
                '''
            }
        }

        // ── Stage 3: SonarQube Static Analysis ───────────────────────────────
        stage('SonarQube Code Scan') {
            steps {
                echo '🔍 Running SonarQube static code analysis...'
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=parksim-os \
                          -Dsonar.sources=backend \
                          -Dsonar.exclusions=**/node_modules/**,**/*.test.js,**/package-lock.json \
                          -Dsonar.javascript.node.maxspace=512 \
                          -Dsonar.host.url=${SONAR_HOST} \
                          -Dsonar.token=${SONAR_TOKEN}
                    '''
                }
            }
        }

        // ── Stage 4: Quality Gate ─────────────────────────────────────────────
        stage('Quality Gate Check') {
            steps {
                echo '🚦 Waiting for SonarQube Quality Gate result...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── Stage 5: Build Docker Images ──────────────────────────────────────
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images for all 4 microservices...'
                sh '''
                    docker compose build --no-cache --parallel
                    echo "✅ All images built:"
                    docker images | grep parksim
                '''
            }
        }

        // ── Stage 6: Deploy to EC2 ────────────────────────────────────────────
        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2 at ${EC2_IP}..."
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        echo "→ Copying docker-compose + database init to EC2..."
                        scp -o StrictHostKeyChecking=no \
                            docker-compose.yml \
                            database-init.sql \
                            ubuntu@${EC2_IP}:${APP_DIR}/

                        echo "→ SSH into EC2 and deploy..."
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "
                            set -e
                            cd ${APP_DIR}
                            echo '→ Pulling latest code...'
                            git pull origin main || echo 'Git pull skipped (no remote configured)'
                            echo '→ Pulling Docker images from registry...'
                            docker compose pull 2>/dev/null || true
                            echo '→ Rebuilding + restarting containers...'
                            docker compose up -d --build --force-recreate
                            echo '→ Cleaning up dangling images...'
                            docker image prune -f
                            echo '→ Running containers:'
                            docker compose ps
                            echo '✅ Deployment complete!'
                        "
                    '''
                }
            }
        }

        // ── Stage 7: Health Check ─────────────────────────────────────────────
        stage('Health Check') {
            steps {
                echo "🏥 Verifying deployment health..."
                sh '''
                    sleep 30
                    echo "→ Checking API Gateway health..."
                    curl -f http://${EC2_IP}:3000/health/user && echo "✅ Gateway healthy!"
                    echo "→ Checking User Service..."
                    curl -f http://${EC2_IP}:3001/health && echo "✅ User Service healthy!"
                '''
            }
        }
    }

    // ── Post Actions ─────────────────────────────────────────────────────────
    post {
        success {
            echo """
╔═══════════════════════════════════════════════════════╗
║  ✅  PIPELINE SUCCESSFUL!                             ║
║  ParkSim OS is LIVE!                                  ║
║  → App:       http://${EC2_IP}:3000                   ║
║  → SonarQube: http://${EC2_IP}:9000                   ║
║  → Jenkins:   http://${EC2_IP}:8080                   ║
╚═══════════════════════════════════════════════════════╝
            """
        }
        failure {
            echo """
╔═══════════════════════════════════════════════════════╗
║  ❌  PIPELINE FAILED                                  ║
║  Check these dashboards:                              ║
║  → SonarQube: http://${EC2_IP}:9000  (code issues)    ║
║  → Jenkins:   http://${EC2_IP}:8080  (build logs)     ║
║  → EC2 logs:  ssh ubuntu@${EC2_IP}                    ║
╚═══════════════════════════════════════════════════════╝
            """
        }
        always {
            archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
        }
        cleanup {
            cleanWs()
        }
    }
}
