# Use Eclipse Temurin JDK 21 as base image
FROM eclipse-temurin:21-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the JAR file (will be built by Jib)
# This Dockerfile is optional - Jib generates its own
# But we provide it for reference and manual Docker builds

EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
