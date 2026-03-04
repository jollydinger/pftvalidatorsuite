FROM python:3.12-alpine

# aiohttp needs these at build time
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY monitor.py .

# -u disables output buffering so JSON log lines reach Docker logs in real time
CMD ["python", "-u", "monitor.py"]
