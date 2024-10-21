# Use the official OpenJDK image as the base image
FROM openjdk:17-jdk-slim

# Set the maintainer label
LABEL maintainer="stefankornel02@gmail.com"

# Update the package list and install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip maven graphviz wget curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

WORKDIR /app/simulator
RUN mvn clean install -Dmaven.test.skip=true -Dcheckstyle.skip 

WORKDIR /app/structure_optimizer
RUN mvn clean install -Dmaven.test.skip=true -Dcheckstyle.skip

RUN pip install -r ./src/main/resources/script/requirement.txt

# Set the default command to run when starting the container
CMD ["mvn", "spring-boot:run"]