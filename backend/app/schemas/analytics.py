from typing import List, Optional
from pydantic import BaseModel


class ChannelMetric(BaseModel):
    channel: str
    count: int
    percentage: int
    color: str


class AnalyticsMetricsResponse(BaseModel):
    avgFirstResponseTime: str
    slaComplianceRate: str
    avgResolutionTime: str
    csatScore: str
    csatTotalReviews: str
    channelBreakdown: List[ChannelMetric]
    openTicketsCount: int
    urgentTicketsCount: int

