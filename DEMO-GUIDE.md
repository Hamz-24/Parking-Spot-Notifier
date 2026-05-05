# 🎓 ParkSim OS — Full DevOps Pipeline Demo Guide
### For Ma'am Presentation | Terraform → Ansible → Jenkins → Docker → SonarQube

---

## ⚠️ Prerequisites Checklist (Do Before Demo)

- [ ] Docker Desktop installed and **running** (whale icon in taskbar)
- [ ] `install-tools.ps1` run as Administrator ✅
- [ ] `configure-aws.ps1` run with your AWS keys ✅
- [ ] `generate-ssh-key.ps1` run ✅
- [ ] `start-devops.ps1` run — Jenkins + SonarQube should be up ✅
- [ ] `terraform-deploy.ps1` run — EC2 created on AWS ✅
- [ ] `ansible/run-ansible.sh` run in WSL ✅
- [ ] Jenkins configured (Steps below) ✅

---

## 🔧 One-Time Jenkins Setup (Before Demo Day)

### Step 1: Open Jenkins
1. Open browser → go to **http://localhost:8080**
2. Enter initial password (printed by `start-devops.ps1`)
3. Click **"Install Suggested Plugins"** → wait 3 minutes

### Step 2: Create Admin User
- Username: `admin`
- Password: `parksim2024`
- Full name: Your name

### Step 3: Install Required Plugins
Go to: `Manage Jenkins` → `Plugins` → `Available Plugins`

Search and install:
- ✅ **SonarQube Scanner**
- ✅ **SSH Agent**
- ✅ **Docker Pipeline**
- ✅ **Pipeline: Stage View**
- ✅ **Blue Ocean** (nice UI)

Click **Install** → restart Jenkins

### Step 4: Configure SonarQube in Jenkins
1. `Manage Jenkins` → `System`
2. Scroll to **SonarQube servers** → click `Add SonarQube`
3. Fill in:
   - Name: `SonarQube`
   - Server URL: `http://sonarqube:9000`
   - Server authentication token: (get from Step 5)
4. Click Save

### Step 5: Get SonarQube Token
1. Open **http://localhost:9000** → login: `admin` / `admin`
2. Change password to `parksim2024` when prompted
3. Top right → `My Account` → `Security`
4. Generate token → name: `jenkins-token` → Type: `Global Analysis Token`
5. **Copy the token!** (shown only once)

### Step 6: Add Jenkins Credentials
Go to: `Manage Jenkins` → `Credentials` → `System` → `Global credentials` → `Add Credentials`

Add these 3 credentials:

| Kind | ID | Value |
|------|-----|-------|
| Secret text | `SONAR_TOKEN` | Token from Step 5 |
| Secret text | `EC2_PUBLIC_IP` | Your EC2 IP from `terraform output public_ip` |
| SSH Username with private key | `ec2-ssh-key` | Username: `ubuntu`, Private Key: paste contents of `~/.ssh/id_rsa` |

### Step 7: Create Jenkins Pipeline Job
1. Dashboard → `New Item`
2. Name: `parksim-pipeline`
3. Type: **Pipeline** → OK
4. Under **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `file:///workspace` (maps to your project folder)
   - Branch: `*/main` or `*/master`
5. Click **Save**

---

## 🎬 Demo Script (What to Say to Ma'am)

### Part 1: Show the Architecture (2 minutes)
> "Ma'am, this is the ParkSim OS — a microservices-based parking notification system.
> We have implemented a complete DevOps pipeline with 5 tools:
> Terraform, Ansible, Jenkins, Docker, and SonarQube."

Show the project folder structure briefly.

---

### Part 2: Terraform — Infrastructure as Code (3 minutes)

**Open terminal → navigate to `terraform/` folder**

```powershell
cd terraform
terraform init
```

> "Terraform downloads the AWS provider plugin."

```powershell
terraform plan
```

> "This is Infrastructure as Code. Terraform shows us exactly what it WILL create on AWS:
> - 1 EC2 instance (Ubuntu 22.04)
> - 1 Security Group with ports for SSH, HTTP, Jenkins, SonarQube
> - 1 SSH Key Pair
> All defined in code — reproducible, version-controlled."

**Show AWS Console** → EC2 Dashboard → show the running instance

> "And here it is — actually RUNNING on AWS. Created by Terraform with a single command."

---

### Part 3: Ansible — Configuration Management (3 minutes)

**Open `ansible/playbook.yml` in VS Code**

> "After Terraform creates the server, Ansible configures it.
> This playbook automatically installs Docker, Nginx, Git on the EC2 instance.
> No manual SSH-ing, no manual setup — everything is automated."

Show the playbook tasks:
- System update
- Install Docker
- Deploy application
- Configure Nginx reverse proxy
- Health check

> "We run `ansible-playbook` and it configures the bare server into a production-ready environment."

---

### Part 4: Jenkins — CI/CD Pipeline (5 minutes)

**Open http://localhost:8080 → parksim-pipeline**

> "Jenkins is our CI/CD orchestrator. Every time code is pushed, it automatically runs this pipeline."

Click **Build Now** → watch the pipeline run

Show each stage:
1. **Clone Repository** → "Pulls latest code"
2. **Install Dependencies** → "npm install for all 4 microservices"
3. **SonarQube Code Scan** → "Sends code to SonarQube for quality analysis"
4. **Quality Gate Check** → "Pipeline STOPS if code quality is bad"
5. **Build Docker Images** → "Builds 4 Docker images"
6. **Deploy to EC2** → "SSHes into AWS and starts the containers"
7. **Health Check** → "Verifies all services are running"

> "If SonarQube finds critical bugs, the pipeline fails automatically — bad code never reaches production."

---

### Part 5: SonarQube — Code Quality (2 minutes)

**Open http://localhost:9000 → parksim-os project**

Show:
- Overall code quality
- Bugs, vulnerabilities, code smells count
- Coverage percentage
- Quality Gate: PASSED ✅

> "SonarQube gives us visibility into code quality.
> We've set quality gates: zero new critical bugs, less than 3% code duplication.
> If code fails these thresholds, deployment is automatically blocked."

---

### Part 6: Docker — Running Application (2 minutes)

```powershell
docker ps
```

> "All 4 microservices are running as Docker containers on the AWS EC2 instance."

**Open browser → http://[EC2-IP]:3000**

> "And here is the live ParkSim application — running on real AWS infrastructure,
> deployed automatically through our DevOps pipeline!"

Show:
- Docker containers (4 services + MySQL)
- Application working in browser

---

### Part 7: Summary (1 minute)

> "To summarize:
> - **Terraform** → provisions cloud infrastructure as code
> - **Ansible** → configures servers automatically
> - **Jenkins** → runs our CI/CD pipeline on every commit
> - **SonarQube** → enforces code quality gates
> - **Docker** → packages and runs our microservices
>
> This is a production-grade DevOps pipeline.
> Any developer on the team can push code, and it automatically:
> 1. Checks quality
> 2. Builds containers
> 3. Deploys to AWS
> — with zero manual steps."

---

## 🛑 Teardown After Demo (IMPORTANT — saves AWS credits)

```powershell
# Stop Jenkins + SonarQube locally
docker compose -f devops\docker-compose.devops.yml down

# DESTROY EC2 instance (stop AWS charges!)
cd terraform
terraform destroy
# Type: yes
```

> ⚠️ **Always run `terraform destroy` after demo** to avoid charges on your AWS account!

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Jenkins not loading | Wait 2 more minutes, it's slow on first start |
| SonarQube shows "starting" | Wait 3-4 minutes, it needs time to initialize |
| Terraform error: "no valid credential" | Run `configure-aws.ps1` again |
| SSH connection to EC2 fails | Check AWS Security Group has port 22 open |
| Docker build fails | Make sure Docker Desktop is running |
| Pipeline fails at Quality Gate | Check SonarQube at localhost:9000 for issues |
