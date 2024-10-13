# Use the official OpenJDK image as the base image
FROM openjdk:17-jdk-slim

# Set the maintainer label
LABEL maintainer="stefankornel02@gmail.com"

# Update the package list and install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR simulator

# Verify installation
RUN java -version && python3 --version && mvn --version

# Set the default command to run when starting the container
CMD ["java", "-version"]