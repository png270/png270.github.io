---
title: 'SecOps with OWASP Juice Shop'
published: 2025-07-10
draft: false
description: 'Setting up ELK for OWASP Juice Shop'
tags: ['ELK', 'Automation', 'OWASP Juice Shop']
---
## SecOps with OWASP Juice Shop

While checking our OWASP Juice Shop to learn threat modeling, I came across an idea and after refining it multiple times, I decided to work on a SecOps lab simulating attack detection and DevSecOps lifecycle.  
In this article, I’ll document everything I’ve done so far and how I plan to add more features to this so called “lab”.

My tech-stack, for now, includes – Docker, ELK Stack & GitHub Actions pipeline.

### Setting up OWASP Juice Shop on Docker

Juice Shop is a “deliberately made vulnerable” web application that acts as a “guinea pig” for security enthusiasts to test their hacking skills as well as security tools against a popular web-app stack.

### To set it up, follow the instructions on the official GitHub repository – [Link](https://github.com/juice-shop/juice-shop)
1. Install Docker, if not already done.
2. Use command – `docker pull bkimminich/juice-shop`
3. Use command – `docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop`
4. Browse – `http://localhost:3000` to check if Juice Shop is up and running.

Once this works, create a `docker-compose.yml` file to simplify the set-up going forward.

```
version: "3.8"

services:
  juice-shop:
    image: bkimminich/juice-shop
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"

```


Run – `docker compose up -d`
Check again – `http://localhost:3000`

## ELK What?
ELK is a collection of three products developed and maintained by Elastic. It also adds “Beats” to it stack as well, the fourth product.
ELK is basically a search and analysis engine. The components are as follows – 
1. Logstash - Log aggregator, collects data from various input sources, executes and transforms it, sends to an output destination (acts as a processor of sorts)
2. Kibana - visualization (acts as a dashboard of sorts)
3. Beats - Lightweight agents, installed on "edge hosts", collects different types of data and forwards into the stack, collector of sorts
4. Filebeat (log files), Packetbeat (network data), Metricbeat (systema and service metrics) and more.
5. Elasticsearch - Indexing & storage (kind of database system)

You can also add other components like Kafka, RabbitMQ etc. in between Beats and Logstash to add buffering and support resilience when there’s huge amount of data to be ingested.

So, the stack looks something like this – 
`Source` -> `Beat` -> `Logstash` -> `Elasticsearch` -> `Kibana`

> There’s a subtle difference between ELK and Elastic stack. ELK Stack is ELK components together (Elasticsearch, Logstash, and Kibana). You add Beats and other shippers, it becomes Elastic Stack.

### Setting up ELK – 
1. Create another `docker-compose.yml` file.
```
version: "3.8"

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.3
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.3
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.3
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.3
    user: root
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
    depends_on:
      - logstash

```

2. Now use Filebeat to get the Juice Shop logs. Create a filebeat.yml` file.

```
filebeat.inputs:
- type: container
  paths:
    - /var/lib/docker/containers/*/*.log
  processors:
    - add_docker_metadata: ~

output.logstash:
  hosts: ["logstash:5044"]

```

This will set up to read docker container logs. It’ll tag logs with container name and then send them to Logstash.
Now to configure Logstash, create a `logstash.conf` file.

```

input {
  beats {
    port => 5044
  }
}

filter {
  if "juice-shop" in [container][name] {
    grok {
      match => {
        "message" => "%{IPORHOST:client_ip} .* \"%{WORD:method} %{URIPATHPARAM:url} HTTP/%{NUMBER:http_version}\" %{NUMBER:status}"
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "juice-shop-%{+YYYY.MM.dd}"
  }
}

```

### Check everything is working –
Run `docker compose up -d` 
For Elasticsearch – `http://localhost:9200`
For Kibana – `http://localhost:5601`

If you can access `localhost:5601`, then you go to options (three lines on the left), click “Analytics” and then click “Discover”.

You’ll have to create a “Data View” -
1. Give the data view name as “juice-shop-*”
2. Time field as @timestamp.
3. Click Discover.

This should start showing all the logs.

## GitHub Actions

I'm using GitHub Actions here to manage my project. It's GitHub's built-in CI/CD system. 

I push my code and GitHub will automatically run checks for my infrastructure that I just built. It'll see if my YAML syntax is correct and detects if anything is broken. 

It can also scan for vulnerable depedencies, misconfigs and exposed secrets using Trivy.

It utilizes a temporary VM called a "Runner" where it'll execute and run checks. Once the GitHub Actions pipeline I created finishes execution, VM is destroyed.

Hence, good for automated validation.

### To set Up GitHub Actions Pipeline

1. Create a folder - `.github`. This won't show up when you check with the command `ls`. So try with `ls -a` as folders with `.` are often hidden in Linux based systems.
2. Create a workflow folder - `mkdir -p .github/workflows`
3. Create a workflow file - `touch .github/workflows/ci.yml`
4. Edit the file with following content - 

```
name: ELK Security Lab CI

on:
  push:
    branches: [ main ]
  pull_request:

jobs:

  lint-configs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install YAML linter
        run: pip install yamllint

      - name: Lint YAML files
        run: yamllint .

  validate-docker:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Validate docker-compose
        run: docker compose -f docker/docker-compose.yml config

  security-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Run Trivy Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .

```
5. Push the project to GitHub repo.

On GitHub, in your repo, under 'Actions" tab, the pipeline being executed. You can check if anything fails there.

