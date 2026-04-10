# syntax=docker/dockerfile:1

# Root Dockerfile for Render/CI builds.
# Builds and runs the Spring Boot backend located in ./albelt-api.

FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace/albelt-api

# Copy pom first for better layer caching
COPY albelt-api/pom.xml ./pom.xml

# Copy sources
COPY albelt-api/src ./src

# Build an executable Spring Boot jar
RUN mvn -DskipTests package

# Pick the repackaged jar (exclude *.jar.original)
RUN JAR_FILE="$(ls target/*.jar | grep -v '\.jar\.original$' | head -n 1)" \
  && test -n "$JAR_FILE" \
  && cp "$JAR_FILE" /workspace/app.jar

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /workspace/app.jar ./app.jar

EXPOSE 8080

# Render sets PORT; Spring Boot uses server.port (defaults to 8080)
ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
