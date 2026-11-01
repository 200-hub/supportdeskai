from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Standard health check response model.
    """
    status: str = Field(default="ok", description="Overall system health status")
    app_name: str = Field(description="Name of the application")
    version: str = Field(description="Current application version")
    environment: str = Field(description="Runtime environment (e.g., development, production)")
    timestamp: datetime = Field(description="Server timestamp in UTC")
    database: Optional[str] = Field(default="connected", description="Database connection health")
    details: Optional[Dict[str, str]] = Field(default=None, description="Detailed service health indicators")

