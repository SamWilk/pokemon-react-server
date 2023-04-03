FROM node:latest

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Start the application
CMD ["npm","start"]


# FROM node:latest as build-stage
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --production
# COPY ./ .
# RUN npm run build

# FROM nginx
# RUN mkdir /app
# COPY --from=build-stage /app/dist /app
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80