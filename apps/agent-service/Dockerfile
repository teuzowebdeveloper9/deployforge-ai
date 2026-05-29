FROM python:3.12-slim
WORKDIR /app

COPY apps/agent-service ./
RUN pip install --no-cache-dir -e .

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
