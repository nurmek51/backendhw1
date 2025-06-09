FROM python:3.12-slim-bullseye

WORKDIR /app

COPY requirements.txt .

# Install curl to download wait-for-it.sh
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Download wait-for-it.sh
RUN curl -o /usr/local/bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
    && chmod +x /usr/local/bin/wait-for-it.sh

RUN pip install --no-cache-dir -r requirements.txt

COPY . . 