FROM node:18-alpine

WORKDIR /app

# Declare build-time args
ARG PORT
ARG JWT_SECRET
ARG GOOGLE_CLIENT_ID
ARG AWS_HOSTED_ZONE_ID

# Set environment variables from build args
ENV PORT=$PORT
ENV JWT_SECRET=$JWT_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV AWS_HOSTED_ZONE_ID=$AWS_HOSTED_ZONE_ID

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["node", "app.js"]
