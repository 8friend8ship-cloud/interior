# Vercel Deployment Target

- Product: Interior AI Estimate
- Domain: interior-ai-estimate.com
- Role: canonical customer frontend
- Deployment flow: GitHub representative branch -> Vercel Preview -> E2E verification -> Production -> domain attach
- Production gate: do not attach domain until central endpoint, result/audit IDs, customer display, error recovery, and runtime regression checks pass.
- Billing rule: no new paid service or plan change without owner approval.
