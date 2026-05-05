import jenkins.model.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import org.jenkinsci.plugins.plaincredentials.impl.*
import com.cloudbees.jenkins.plugins.sshcredentials.impl.*
import hudson.util.Secret
import hudson.plugins.sonar.*
import hudson.plugins.sonar.model.TriggersConfig
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*

def instance = Jenkins.getInstance()
def store = instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

// 1. EC2_PUBLIC_IP
def ec2IpCred = new StringCredentialsImpl(
  CredentialsScope.GLOBAL,
  "EC2_PUBLIC_IP",
  "AWS Public IP",
  Secret.fromString("13.216.213.33")
)
store.addCredentials(Domain.global(), ec2IpCred)

// 2. SONAR_TOKEN
def sonarTokenCred = new StringCredentialsImpl(
  CredentialsScope.GLOBAL,
  "SONAR_TOKEN",
  "SonarQube Token",
  Secret.fromString("sqa_6975372ef8504cc148c6a2218cfd4bad24432ced")
)
store.addCredentials(Domain.global(), sonarTokenCred)

// 3. SSH Key
def sshKeyCred = new BasicSSHUserPrivateKey(
  CredentialsScope.GLOBAL,
  "ec2-ssh-key",
  "ubuntu",
  new BasicSSHUserPrivateKey.DirectEntryPrivateKeySource('''-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
'''),
  "",
  "AWS EC2 SSH Key"
)
store.addCredentials(Domain.global(), sshKeyCred)

// 4. SonarQube Global Config
def sonarGlobalConfig = instance.getDescriptorByType(SonarGlobalConfiguration.class)
def sonarInst = new SonarInstallation(
  "SonarQube",
  "http://sonarqube:9000",
  "SONAR_TOKEN", // credentialsId
  "",
  "",
  null
)
sonarGlobalConfig.setInstallations(sonarInst)
sonarGlobalConfig.save()

// 5. Create Pipeline Job
def jobName = "ParkSim-OS"
def job = instance.getItem(jobName)
if (job == null) {
  job = instance.createProject(WorkflowJob.class, jobName)
}

def userRemoteConfigs = [new UserRemoteConfig("https://github.com/Hamz-24/Parking-Spot-Notifier.git", null, null, null)]
def branches = [new BranchSpec("*/main")]
def scm = new GitSCM(userRemoteConfigs, branches, false, [], null, null, [])
def flowDefinition = new CpsScmFlowDefinition(scm, "Jenkinsfile")
flowDefinition.setLightweight(true)
job.setDefinition(flowDefinition)
job.save()

instance.save()
