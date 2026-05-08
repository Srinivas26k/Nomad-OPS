FROM python:3.11-slim

# Install uv for fast dependency resolution
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies using uv into the system Python
RUN uv pip install --system -e . || uv pip install --system fastapi "uvicorn[standard]" langchain langgraph langchain-ollama websockets pydantic pytest ruff

# Copy all source code
COPY . .

# Cloud Run requirements
ENV PORT=8080
EXPOSE 8080

# Command to run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
