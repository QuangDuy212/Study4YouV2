# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Tải các dependency trước để tận dụng cache của Docker
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Coppy file jar đã build (tên file theo pom.xml)
COPY --from=build /app/target/study4you-backend-1.0.0.jar app.jar
# Tạo thư mục cho file upload
RUN mkdir -p uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
