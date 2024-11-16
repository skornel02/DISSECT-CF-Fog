# Use the official OpenJDK image as the base image
FROM openjdk:21-jdk-slim

# Update the package list and install Python
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y python3 python3-pip maven graphviz wget curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

WORKDIR /app/simulator

RUN pip install --break-system-packages -r ./src/main/resources/script/requirement.txt

RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -Dmaven.test.skip=true -Dcheckstyle.skip

# Set the default command to run when starting the container
CMD ["java", "-cp", "target/dissect-cf-fog-1.0.0-SNAPSHOT-jar-with-dependencies.jar", "hu.u_szeged.inf.fog.simulator.demo.IoTWorkflowSimulation"]
