import jenkins.model.*
import hudson.plugins.sonar.*
import hudson.plugins.sonar.model.TriggersConfig
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.*

def instance = Jenkins.getInstance()

def sonarGlobalConfig = instance.getDescriptorByType(SonarGlobalConfiguration.class)
def sonarInst = new SonarInstallation("SonarQube", "http://13.216.213.33:9000", "SONAR_TOKEN", "", "", null, "", "", "")
sonarGlobalConfig.setInstallations(sonarInst)
sonarGlobalConfig.save()

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
