# 🎓 ParkSim OS — Final DevOps Presentation Guide
### Presentation Script | Terraform → Ansible → Jenkins → Docker → SonarQube

---

## 🏗️ PERSON 1 — Introduction + Architecture
**Objective:** Open the presentation confidently and explain the project idea and microservices.

> "Good morning Ma’am and everyone. Our project is called **ParkSim OS**. It is a real-time parking notification system built using a **Microservices Architecture** and deployed on the cloud using modern DevOps practices. The goal of our project is to solve parking management problems in places like malls, offices, hospitals, and smart cities by providing real-time parking updates."

### Slide 1 — Intro
> "This project demonstrates a complete Production-Ready DevOps Pipeline using **Terraform, Ansible, Jenkins, Docker, and SonarQube** running on **AWS EC2**. Everything is fully automated with zero manual deployment effort."

### Slide 2 — System Architecture
> "Instead of building one large monolithic application, we divided the system into independent microservices:
> 1. **API Gateway** → Controls all incoming traffic.
> 2. **User Service** → Handles authentication and security.
> 3. **Parking Service** → Manages parking slot logic.
> 4. **Notification Service** → Sends real-time updates using SSE.
> 5. **MySQL Database** → Stores persistent application data.
>
> All services run inside isolated Docker containers on AWS EC2. Now my teammate will explain how we automated the cloud infrastructure using Terraform and Ansible."

---

## 🛠️ PERSON 2 — Terraform + Ansible
**Objective:** Explain Infrastructure as Code and Configuration Management.

### Slide 3 — Terraform (IaC)
> "For infrastructure provisioning, we used **Terraform**. Instead of manually creating AWS resources from the console, we define everything using code. Terraform automatically creates our EC2 virtual servers, Security Groups, and SSH Keys. This makes our infrastructure reproducible, version-controlled, and automated."
> *(Show terraform/main.tf and point to EC2 instance and Security group ports)*

### Slide 4 — Ansible (Configuration)
> "Once Terraform creates the EC2 instance, the server is still empty. We use **Ansible** for automated server configuration. Our Ansible playbook updates system packages, installs Docker, and configures Nginx. This ensures every server is configured identically without manual setup. Now my teammate will explain the CI/CD pipeline."

---

## 🚀 PERSON 3 — Jenkins + SonarQube
**Objective:** Explain automation pipeline and quality checking.

### Slide 5 — CI/CD Pipeline
> "For Continuous Integration and Continuous Deployment, we used **Jenkins**. Whenever developers push code to GitHub, Jenkins automatically starts the pipeline. It handles cloning the repository, running a SonarQube scan, building Docker images, and deploying to AWS. This removes manual deployment and reduces human errors."

### Slide 6 — SonarQube (Quality)
> "We also integrated **SonarQube** for static code analysis. It checks for bugs, security vulnerabilities, and code smells. We've set Quality Gates to ensure only high-quality code reaches our production server. Now my teammate will demonstrate the live application."

---

## 🎮 PERSON 4 — Docker + Live Demo + Conclusion
**Objective:** Real-time demonstration and wrap-up.

### Slide 7 — Docker
> "We containerized all services using **Docker**. Each service runs independently inside its own container, providing isolation and portability. Currently, all 5 containers are running successfully on our AWS EC2 instance."
> *(Show terminal with 'docker ps' output)*

### Slide 8 — Live Demo
**Action: Open http://13.216.213.33:3000**
> "Now we’ll demonstrate the live application. When a user claims a parking spot, the slot immediately turns red. This happens through **Server-Sent Events** for real-time synchronization. The backend also contains **auto-expiry logic**; after 60 seconds, the slot is automatically released. The system log shows live event streaming and heartbeat monitoring to maintain stable communication."

### Final Conclusion
> "In conclusion: Terraform automates infrastructure, Ansible automates configuration, Jenkins automates CI/CD, SonarQube ensures quality, and Docker runs our microservices. ParkSim OS demonstrates how modern cloud-native applications are deployed using Production-Ready DevOps practices."
