FROM python:3.10-slim

# System dependencies (for building Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy only the necessary files for installation
COPY pyproject.toml .
COPY marimo/ marimo/

# Install marimo with test dependencies
# We use testcore since it has the minimal testing requirements
RUN pip install -e .[testcore]

# Expose the port used in the test
EXPOSE 2718

# Default command that will be overridden in the test
CMD ["python", "-m", "marimo", "edit", "--port", "2718", "--host", "0.0.0.0", "--headless"]
