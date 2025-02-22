# Build frontend client
FROM node:20-slim AS node

LABEL maintainer="stefan.kornel@stud.u-szeged.hu"

RUN corepack enable

COPY ./structure_optimizer/src/frontend /app

WORKDIR /app
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install

RUN yarn run build

FROM openjdk:21-jdk-slim AS java

# Build backend (and java dependencies)
FROM java AS build

LABEL maintainer="stefan.kornel@stud.u-szeged.hu"

# INstall maven, python dependencies and graphviz
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y python3 python3-pip maven graphviz && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app
COPY --from=node /app/dist /app/structure_optimizer/src/main/resources/static

# Build simulator
WORKDIR /app/simulator
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean install -Dmaven.test.skip=true -Dcheckstyle.skip 

# Build backend
WORKDIR /app/structure_optimizer
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package spring-boot:repackage -Dmaven.test.skip=true -Dcheckstyle.skip

# Create minimal final image
FROM java AS prod

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && \
    apt-get install -y wget curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY ./simulator/src/main/resources/demo /src/main/resources/demo
COPY --from=build /app/structure_optimizer/target/structure_optimizer-0.0.1-SNAPSHOT.jar /app/structure_optimizer.jar

EXPOSE 8080
CMD ["java", "-jar", "/app/structure_optimizer.jar"]