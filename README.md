# DevOps

DevOps project with developer tool use.

## Jenkins

On jenkins branch run this commands on terminal.

```sh
docker compose -f docker-compose.jenkins.yml up -d --build
```

to create and run jenkins instance.

```sh
docker exec fms-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

to get jenkins instance password for log in.
