# Monitoring and Alerting Architecture

This document specifies the operational telemetry, key performance indicators, alerting rules, and notification escalation channels for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Operational Telemetry Metrics

The platform monitors three distinct telemetry planes:

```text
[ Infrastructure Plane ]  ──► Container CPU/Memory, Cloud Load Balancer, Host Network.
            │
            ▼
[ Application Plane ]     ──► HTTP Status Codes (4xx, 5xx), P95 Latencies, Active Sessions.
            │
            ▼
[ Database Plane ]        ──► PostgreSQL Connection Pool, Buffer Hit Ratio, Replication Lag.
```

---

## 2. Alerting Rules and Severity Hierarchy

Alerts are categorized into three operational severity levels:

| Severity Level | Alert Condition | Evaluation Window | Response SLA | Target Escalation Channel |
| :--- | :--- | :---: | :---: | :--- |
| **P1 - Critical** | Database unreachable (`readiness` probe fails) OR HTTP 5xx error rate $> 2.0\%$. | 2 minutes | **$\le 15$ minutes** | On-call phone page + `#incident-critical` Slack |
| **P1 - Critical** | Multi-tenant isolation anomaly detected in application logs. | Instant | **$\le 15$ minutes** | Security Lead pager + Tech Lead pager |
| **P2 - Major** | P95 API latency exceeds $1,000\text{ ms}$ OR Connection pool utilization $> 85\%$. | 5 minutes | $\le 60$ minutes | Team notification Slack channel |
| **P3 - Minor** | Daily automated database snapshot failure OR Disk usage $> 75\%$. | 1 hour | $\le 4$ business hours| Engineering backlog ticket + email alert |

---

## 3. Synthetic Monitoring Probes

In addition to internal metrics, an external synthetic probe monitors the platform every 60 seconds from an independent cloud region:
- Executes `GET https://app.fsd-sdg4.internal/api/v1/health/liveness`.
- Executes lightweight mock sign-in with synthetic monitoring credentials.
- Alerts on-call engineering if two consecutive probes fail or exceed $2,000\text{ ms}$ response latency.
