"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Loader2, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const FRAMEWORKS = [
  { value: "custom", label: "Custom Policy" },
  { value: "soc2", label: "SOC 2" },
  { value: "hipaa", label: "HIPAA" },
  { value: "pci_dss", label: "PCI DSS" },
  { value: "gdpr", label: "GDPR" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "owasp", label: "OWASP Top 10" },
  { value: "nist_csf", label: "NIST CSF" },
  { value: "ccpa", label: "CCPA" },
  { value: "fedramp", label: "FedRAMP" },
];

interface PolicyTemplate {
  name: string;
  description: string;
  content: string;
  tags: string;
}

const POLICY_TEMPLATES: Record<string, PolicyTemplate> = {
  soc2: {
    name: "SOC 2 Type II Compliance",
    description: "Service Organization Control 2 trust service criteria for security, availability, and confidentiality",
    tags: "compliance, soc2, security, audit",
    content: `## CC6.1 – Logical and Physical Access Controls
- All system access must require unique user authentication
- Multi-factor authentication (MFA) must be enforced for all privileged accounts
- Service accounts must use API keys or certificates, never shared passwords
- Access credentials must never be hardcoded in source code
- Session tokens must expire after a maximum of 24 hours of inactivity

## CC6.2 – System Access Restrictions
- Role-based access control (RBAC) must be implemented for all endpoints
- API endpoints must enforce authorization checks before processing requests
- Admin and management interfaces must be restricted to authorized roles only
- All access control decisions must be logged for audit purposes

## CC6.6 – Security Measures Against External Threats
- All external inputs must be validated and sanitized
- SQL injection, XSS, and command injection protections must be in place
- Rate limiting must be applied to all public-facing endpoints

## CC6.7 – Data Transmission Security
- All data in transit must use TLS 1.2 or higher
- HTTP Strict Transport Security (HSTS) headers must be set
- Internal service-to-service communication must be encrypted

## CC7.1 – Monitoring and Detection
- Application logs must capture authentication events, errors, and access patterns
- Centralized logging must be implemented
- Alerting must be configured for anomalous access patterns

## CC8.1 – Change Management
- All code changes must go through peer review before deployment
- CI/CD pipelines must include automated testing (unit, integration, security)
- Infrastructure changes must be managed through Infrastructure as Code (IaC)`,
  },
  hipaa: {
    name: "HIPAA Security Rule Compliance",
    description: "Health Insurance Portability and Accountability Act safeguards for electronic protected health information (ePHI)",
    tags: "compliance, hipaa, healthcare, phi, security",
    content: `## §164.312(a) – Access Control
- Unique user identification must be enforced for all users accessing ePHI
- Automatic session logout after 15 minutes of inactivity for ePHI systems
- All ePHI access must be role-based with principle of least privilege
- Multi-factor authentication required for remote access to ePHI

## §164.312(b) – Audit Controls
- All access to ePHI must be logged with user ID, timestamp, and action
- Audit logs must be immutable and retained for a minimum of 6 years
- Audit logs must not contain raw ePHI data

## §164.312(e) – Transmission Security
- All ePHI transmitted over networks must be encrypted (TLS 1.2+)
- API endpoints handling ePHI must enforce HTTPS only

## §164.308(a)(1) – Security Management
- Risk analysis must be conducted and documented annually
- Regular security assessments of applications handling ePHI

## §164.310 – Physical Safeguards (Application Layer)
- ePHI must be encrypted at rest using AES-256 or equivalent
- Database backups containing ePHI must be encrypted`,
  },
  pci_dss: {
    name: "PCI DSS v4.0 Compliance",
    description: "Payment Card Industry Data Security Standard requirements for protecting cardholder data",
    tags: "compliance, pci, payments, security, cardholder-data",
    content: `## Requirement 3 – Protect Stored Account Data
- Primary Account Numbers (PAN) must be rendered unreadable anywhere it is stored
- PAN must never be stored in logs, debug output, or error messages
- Display masking: show only first 6 and last 4 digits of PAN maximum

## Requirement 4 – Encrypt Transmission Over Open Networks
- Strong cryptography (TLS 1.2+) required for all cardholder data transmission
- Insecure protocols (SSL, early TLS) must be disabled

## Requirement 6 – Develop and Maintain Secure Systems
- Custom code must be reviewed for OWASP Top 10 vulnerabilities
- Input validation must be implemented for all user-supplied data
- Output encoding must prevent injection attacks

## Requirement 8 – Identify Users and Authenticate Access
- Unique IDs must be assigned to each person with computer access
- MFA required for all access to CDE
- Passwords must be minimum 12 characters

## Requirement 10 – Log and Monitor All Access
- Audit trails must link all access to individual users
- Logs must be secured and retained for at least 12 months`,
  },
  gdpr: {
    name: "GDPR Technical Compliance",
    description: "EU General Data Protection Regulation technical requirements for processing personal data",
    tags: "compliance, gdpr, privacy, eu, data-protection",
    content: `## Article 5 – Data Processing Principles
- Personal data collection must be limited to what is strictly necessary (data minimization)
- Data retention periods must be defined and enforced programmatically
- Automated data deletion/anonymization must be implemented for expired retention periods

## Article 15-20 – Data Subject Rights
- Export endpoint must provide all personal data in machine-readable format
- Deletion endpoint must remove all personal data across all systems
- Rectification endpoint must allow users to update their personal data

## Article 25 – Data Protection by Design and Default
- Privacy settings must default to the most protective option
- Personal data must be pseudonymized where possible
- Data fields must use encryption at rest (AES-256 or equivalent)

## Article 32 – Security of Processing
- Encryption must be applied to personal data at rest and in transit
- Access controls must ensure only authorized personnel access personal data

## Technical Implementation Checks
- No personal data in application logs (or properly masked)
- Database queries for personal data must be parameterized
- Test data must not contain real personal data`,
  },
  iso27001: {
    name: "ISO 27001:2022 Controls",
    description: "Information security management system controls from ISO/IEC 27001 Annex A",
    tags: "compliance, iso27001, isms, security, international",
    content: `## A.5 – Organizational Controls
- Information security policies must be documented and reviewed annually
- Security roles and responsibilities must be clearly defined
- Segregation of duties must be enforced in critical operations

## A.8.1-8.5 – Access Management
- User access must follow formal registration and de-registration process
- Privileged access rights must be restricted and monitored
- Authentication must use strong mechanisms (MFA where applicable)
- Access rights must be reviewed at defined intervals (quarterly minimum)

## A.8.11-8.16 – Data Protection
- Data masking must be applied to sensitive information in non-production environments
- Information backup must be tested regularly for recoverability
- Logging must capture security-relevant events

## A.8.23-8.28 – Development Security
- Secure development lifecycle must be followed
- Secure coding principles must be enforced (input validation, output encoding)
- Automated security testing must be integrated in CI/CD
- Separation of development, testing, and production environments`,
  },
  owasp: {
    name: "OWASP Top 10 (2021) Security",
    description: "Open Web Application Security Project Top 10 most critical web application security risks",
    tags: "security, owasp, web, application-security, vulnerabilities",
    content: `## A01:2021 – Broken Access Control
- Server-side access control enforcement required
- Default deny: access must be explicitly granted
- JWT tokens must be validated and invalidated on logout
- Rate limiting must be applied to API and controller access

## A02:2021 – Cryptographic Failures
- Sensitive data must be encrypted at rest (AES-256 or equivalent)
- Data in transit must use TLS 1.2+
- Passwords must use strong adaptive hashing (bcrypt, scrypt, Argon2)

## A03:2021 – Injection
- All user input must be validated, filtered, and sanitized
- SQL queries must use parameterized statements or ORM with bound parameters
- LDAP, OS command, XPath, and NoSQL injection must be prevented

## A05:2021 – Security Misconfiguration
- Default credentials must be changed or disabled
- Error handling must not reveal stack traces or sensitive details
- Security headers must be configured: CSP, X-Content-Type-Options, X-Frame-Options

## A07:2021 – Identification and Authentication Failures
- Multi-factor authentication must be implemented for sensitive operations
- Account lockout with escalating delays
- Session identifiers must be cryptographically random and invalidated on logout`,
  },
  nist_csf: {
    name: "NIST Cybersecurity Framework",
    description: "National Institute of Standards and Technology Cybersecurity Framework core functions",
    tags: "compliance, nist, csf, security, risk-management, federal",
    content: `## Identify (ID)
- All software components and dependencies must be inventoried
- Data flows must be documented
- Threat modeling must be performed for critical application features
- Security policies must be established and communicated

## Protect (PR)
- Identities and credentials must be managed for authorized users
- Access permissions must follow principle of least privilege
- Data at rest must be encrypted (AES-256)
- Data in transit must be encrypted (TLS 1.2+)
- Backups must be conducted, maintained, and tested

## Detect (DE)
- Baseline of network and application operations must be established
- Network must be monitored for security events
- Vulnerability scans must be performed regularly

## Respond (RS)
- Incident response plan must be established and executable
- Incidents must be contained and mitigated

## Recover (RC)
- Recovery plan must be executed during or after an incident
- Recovery plans must incorporate lessons learned`,
  },
  ccpa: {
    name: "CCPA / CPRA Compliance",
    description: "California Consumer Privacy Act and California Privacy Rights Act technical requirements",
    tags: "compliance, ccpa, cpra, privacy, california, data-protection",
    content: `## §1798.100 – Consumer Right to Know
- Disclosure mechanism must list categories of personal information collected
- API/UI must allow consumers to request their collected personal information
- Response to access requests must be provided within 45 days

## §1798.105 – Right to Delete
- Deletion endpoint must be implemented for consumer personal information
- Deletion must propagate to all service providers and third parties
- Verification of identity must precede deletion processing

## §1798.120 – Right to Opt-Out of Sale/Sharing
- Opt-out mechanism must be prominently available
- Opt-out preference must be respected within 15 business days
- Global Privacy Control (GPC) signal must be honored

## Technical Implementation Requirements
- Personal information inventory with data mapping
- Automated data subject request (DSR) processing pipeline
- Consent management platform with preference storage
- Audit trail for all DSR processing`,
  },
  fedramp: {
    name: "FedRAMP Security Controls",
    description: "Federal Risk and Authorization Management Program security controls for cloud services",
    tags: "compliance, fedramp, federal, government, cloud-security",
    content: `## AC – Access Control
- AC-2: Account management with automated audit of account creation, modification, and removal
- AC-3: Access enforcement using RBAC with deny-by-default
- AC-6: Least privilege enforced at application, database, and infrastructure levels
- AC-7: Unsuccessful login attempts limited (lock after 3 attempts for 30 minutes)
- AC-11: Session lock after 15 minutes of inactivity
- AC-17: Remote access must use encrypted channels with MFA

## AU – Audit and Accountability
- AU-2: Auditable events must include logins, logouts, access to objects, admin actions
- AU-3: Audit records must contain type, time, location, source, outcome, identity
- AU-9: Audit records must be protected from unauthorized access or modification
- AU-11: Audit record retention for minimum 90 days online, 1 year archived

## IA – Identification and Authentication
- IA-2: Unique user identification with MFA for privileged and network access
- IA-5: Authenticator management (passwords: 12+ chars, complexity, 60-day rotation)
- IA-6: Authenticator feedback must be obscured (mask passwords)

## SC – System and Communications Protection
- SC-8: Transmission confidentiality and integrity (TLS 1.2+ mandatory)
- SC-13: Use of FIPS 140-2/140-3 validated cryptographic modules
- SC-28: Protection of information at rest (FIPS-validated encryption)

## SI – System and Information Integrity
- SI-2: Flaw remediation (critical: 30 days, high: 90 days)
- SI-4: System monitoring with inbound and outbound traffic analysis
- SI-10: Information input validation on all user-supplied data`,
  },
};

export default function CreatePolicyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [framework, setFramework] = useState("custom");
  const [tags, setTags] = useState("");

  const handleFrameworkChange = (value: string) => {
    setFramework(value);
    const template = POLICY_TEMPLATES[value];
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setContent(template.content);
      setTags(template.tags);
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createPolicy({
        name,
        description,
        content,
        framework,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast({ title: "Policy created", description: `${name} is ready to use in assessments`, duration: 2000 });
      navigate("/hub?tab=policies");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create policy", variant: "destructive", duration: 2000 });
    },
  });

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-200">Create Assessment Policy</h1>
            <Badge className="bg-[#105e6e] text-white uppercase tracking-tighter border-0 h-4 px-1.5 text-[9px]">Clavis</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">Define compliance rules and standards for codebase assessments</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          className="space-y-6"
        >
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            {/* Policy Name */}
            <div>
              <Label htmlFor="policy-name" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Policy Name
              </Label>
              <Input
                id="policy-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Internal Security Standards v2"
                disabled={createMutation.isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Framework */}
            <div>
              <Label htmlFor="policy-framework" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Framework
              </Label>
              <select
                id="policy-framework"
                value={framework}
                onChange={(e) => handleFrameworkChange(e.target.value)}
                disabled={createMutation.isPending}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#105e6e]"
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw.value} value={fw.value}>{fw.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="policy-desc" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Description
              </Label>
              <Input
                id="policy-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of what this policy checks"
                disabled={createMutation.isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="policy-tags" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Tags (comma-separated)
              </Label>
              <Input
                id="policy-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="security, compliance, internal"
                disabled={createMutation.isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </Card>

          {/* Policy Content */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <Label htmlFor="policy-content" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-1">
              Policy Content
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Write the full policy rules, checklist items, and requirements. This will be fed to the AI agent during assessment.
            </p>
            <Textarea
              id="policy-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Example:\n\n## Authentication\n- All endpoints must require authentication\n- Passwords must be hashed with bcrypt (min 12 rounds)\n- JWT tokens must expire within 24 hours\n\n## Data Protection\n- PII must be encrypted at rest\n- All API responses must strip internal IDs\n- Database queries must use parameterized statements`}
              rows={14}
              disabled={createMutation.isPending}
              className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono text-xs resize-none"
            />
          </Card>

          {/* Info */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-black text-xs uppercase tracking-widest text-[#105e6e] dark:text-teal-400">Policy Engine Features</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["AI-Powered Assessment", "Custom Rule Definitions", "Framework Templates", "Compliance Reporting"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <CheckCircle className="h-3.5 w-3.5 text-[#105e6e] flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/hub?tab=policies")}
              disabled={createMutation.isPending}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || !content || createMutation.isPending}
              className="bg-[#105e6e] hover:bg-[#0d4d59] text-white min-w-[160px] font-bold uppercase text-xs tracking-widest"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Creating...</>
              ) : (
                "Create Policy"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
