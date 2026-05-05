# =============================================================================
# ParkSim OS — Custom Jenkins Image
# Includes: Node.js 20, sonar-scanner, Docker CLI, SSH tools
# =============================================================================

FROM jenkins/jenkins:lts-jdk17

USER root

# ─── Install System Dependencies ──────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    openssh-client \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# ─── Install Node.js 20 ───────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && node --version \
    && npm --version

# ─── Install Docker CLI (to build images inside Jenkins) ──────────────────────
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
       https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
       > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# ─── Install SonarQube Scanner ────────────────────────────────────────────────
ARG SONAR_SCANNER_VERSION=6.2.1.4610
RUN wget -q "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux-x64.zip" \
         -O /tmp/sonar-scanner.zip \
    && unzip -q /tmp/sonar-scanner.zip -d /opt/ \
    && mv /opt/sonar-scanner-${SONAR_SCANNER_VERSION}-linux-x64 /opt/sonar-scanner \
    && ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner \
    && rm /tmp/sonar-scanner.zip \
    && sonar-scanner --version

# ─── Install Docker Compose ───────────────────────────────────────────────────
RUN curl -SL "https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64" \
         -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && docker-compose version

# ─── Jenkins Plugins (pre-install for faster setup) ──────────────────────────
USER jenkins
RUN jenkins-plugin-cli --plugins \
    git \
    workflow-aggregator \
    pipeline-stage-view \
    sonarqube-generic-coverage \
    sonar \
    docker-workflow \
    ssh-agent \
    credentials-binding \
    timestamper \
    build-timeout \
    ws-cleanup \
    github \
    blueocean

USER root

# ─── Permissions ─────────────────────────────────────────────────────────────
RUN usermod -aG docker jenkins || true

USER jenkins
