const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {

    var acrServer = project.secrets.acrServer
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var today = new Date()

    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = String(gitSHA)

    var frontend = new Job("job-runner-frontend")
    frontend.storage.enabled = false
    frontend.image = "microsoft/azure-cli"
    frontend.tasks = [
        `cd /src/frontend`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t frontend:${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]

    var api = new Job("job-runner-api")
    api.storage.enabled = false
    api.image = "microsoft/azure-cli"
    api.tasks = [
        `cd /src/api`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t api:${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]

    var importer = new Job("job-runner-importer")
    importer.storage.enabled = false
    importer.image = "microsoft/azure-cli"
    importer.tasks = [
        `cd /src/importer_batch`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t importer:${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]

    var pipeline = new Group()
    pipeline.add(frontend)
    pipeline.add(api)
    pipeline.add(importer)
    pipeline.runAll()

})

