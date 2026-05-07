# 🔑 ParkSim OS — Presentation Links & Credentials
**KEEP THIS OPEN DURING YOUR DEMO**

---

### 🌐 1. Live Application (The "Final Product")
*   **URL:** [http://13.216.213.33:3000](http://13.216.213.33:3000)
*   **Purpose:** Show the live dashboard, claim spots, and show the auto-expiry timer.

---

### 🏗️ 2. Jenkins (The "Automation Engine")
*   **URL:** [http://13.216.213.33:8080](http://13.216.213.33:8080)
*   **Username:** `admin`
*   **Password:** `6eeaf0fae2da4b6c93a362328bf1f5a2`
*   **Purpose:** Show the CI/CD Pipeline stages and trigger a new build.

---

### 🔍 3. SonarQube (The "Code Quality Inspector")
*   **URL:** [http://13.216.213.33:9000](http://13.216.213.33:9000)
*   **Username:** `admin`
*   **Password:** `admin` (or the one you set during setup)
*   **Purpose:** Show the code scan results, bugs found, and the Quality Gate status.

---

### ☁️ 4. AWS Console (The "Infrastructure")
*   **URL:** [AWS EC2 Console (N. Virginia)](https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#Instances:)
*   **Region:** Must be **US East (N. Virginia)**
*   **Resource to show:** `ParkSim-Server` (Instance ID: `i-00c2c23b567f094b` or similar)
*   **Purpose:** Prove that Terraform successfully created the infrastructure.

---

### 📂 5. Local Source Code (The "Definition")
*   **Tool:** VS Code
*   **Key Files to show Ma'am:**
    *   `terraform/main.tf` (Infrastructure definition)
    *   `ansible/playbook.yml` (Server configuration)
    *   `Jenkinsfile` (Pipeline definition)
    *   `docker-compose.yml` (Container orchestration)

---

### 📝 6. Presentation Script
*   **File:** [DEMO-GUIDE.md](file:///c:/Users/hamza/OneDrive/Desktop/DevOps%20-%20Copy/Parking-Spot-Notifier/DEMO-GUIDE.md)
*   **Purpose:** Follow the step-by-step talking points.
