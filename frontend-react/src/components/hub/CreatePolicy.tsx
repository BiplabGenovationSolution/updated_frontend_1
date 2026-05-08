'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const FRAMEWORKS = [
  { value: 'custom', label: 'Custom Policy' },
  { value: 'soc2', label: 'SOC 2' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'pci_dss', label: 'PCI DSS' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'iso27001', label: 'ISO 27001' },
  { value: 'owasp', label: 'OWASP Top 10' },
  { value: 'nist_csf', label: 'NIST CSF' },
  { value: 'ccpa', label: 'CCPA' },
  { value: 'fedramp', label: 'FedRAMP' },
]

interface PolicyTemplate {
  name: string
  description: string
  content: string
  tags: string
}

export const POLICY_TEMPLATES: Record<string, PolicyTemplate> = {
  soc2: {
    name: 'SOC 2 Type II Compliance',
    description: 'Service Organization Control 2 trust service criteria for security, availability, and confidentiality',
    tags: 'compliance, soc2, security, audit',
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

## CC6.3 – Registration and Authorization
- User provisioning must require approval workflows
- Default accounts and credentials must be disabled or removed
- Principle of least privilege must be applied to all access grants

## CC6.6 – Security Measures Against External Threats
- All external inputs must be validated and sanitized
- SQL injection, XSS, and command injection protections must be in place
- Content Security Policy (CSP) headers must be configured
- Rate limiting must be applied to all public-facing endpoints
- Web Application Firewall (WAF) rules should be configured

## CC6.7 – Data Transmission Security
- All data in transit must use TLS 1.2 or higher
- HTTP Strict Transport Security (HSTS) headers must be set
- Certificate pinning should be implemented for mobile/API clients
- Internal service-to-service communication must be encrypted

## CC6.8 – Malicious Software Prevention
- Dependency scanning must be integrated in CI/CD pipeline
- Known vulnerable dependencies must be flagged and remediated
- Container images must be scanned for vulnerabilities before deployment

## CC7.1 – Monitoring and Detection
- Application logs must capture authentication events, errors, and access patterns
- Centralized logging must be implemented (no local-only logs in production)
- Log data must not contain PII or secrets
- Alerting must be configured for anomalous access patterns

## CC7.2 – Incident Response
- Error handling must not expose internal system details to end users
- Stack traces must never be returned in production API responses
- A security incident response runbook must be documented

## CC8.1 – Change Management
- All code changes must go through peer review before deployment
- CI/CD pipelines must include automated testing (unit, integration, security)
- Infrastructure changes must be managed through Infrastructure as Code (IaC)
- Rollback procedures must be documented and tested`,
  },
  hipaa: {
    name: 'HIPAA Security Rule Compliance',
    description: 'Health Insurance Portability and Accountability Act safeguards for electronic protected health information (ePHI)',
    tags: 'compliance, hipaa, healthcare, phi, security',
    content: `## §164.312(a) – Access Control
- Unique user identification must be enforced for all users accessing ePHI
- Emergency access procedures must be documented and implementable
- Automatic session logout after 15 minutes of inactivity for ePHI systems
- All ePHI access must be role-based with principle of least privilege
- Multi-factor authentication required for remote access to ePHI

## §164.312(b) – Audit Controls
- All access to ePHI must be logged with user ID, timestamp, and action
- Audit logs must be immutable and retained for a minimum of 6 years
- Log review procedures must be in place and performed regularly
- Audit logs must not contain raw ePHI data

## §164.312(c) – Integrity Controls
- Mechanisms must verify ePHI has not been altered or destroyed improperly
- Database integrity checks must be implemented
- Data validation must be applied at input and output boundaries
- Checksums or digital signatures should protect ePHI at rest

## §164.312(d) – Person or Entity Authentication
- Authentication must verify the identity of any person or entity seeking ePHI access
- Password complexity requirements: minimum 12 characters, mixed case, numbers, symbols
- Failed login attempts must be limited (lockout after 5 failed attempts)
- Password rotation must be enforced every 90 days

## §164.312(e) – Transmission Security
- All ePHI transmitted over networks must be encrypted (TLS 1.2+)
- Email containing ePHI must use end-to-end encryption
- API endpoints handling ePHI must enforce HTTPS only
- VPN or equivalent must be required for remote access to ePHI systems

## §164.308(a)(1) – Security Management
- Risk analysis must be conducted and documented annually
- Sanctions policy for workforce members violating security policies
- Regular security assessments of applications handling ePHI

## §164.308(a)(5) – Security Awareness Training
- Code comments must not contain ePHI examples or real patient data
- Test fixtures and seed data must use synthetic/de-identified data only
- Environment variables for ePHI systems must be documented

## §164.310 – Physical Safeguards (Application Layer)
- ePHI must be encrypted at rest using AES-256 or equivalent
- Database backups containing ePHI must be encrypted
- Disposal of ePHI data must follow secure deletion procedures
- Media re-use must ensure previous ePHI is irrecoverable`,
  },
  pci_dss: {
    name: 'PCI DSS v4.0 Compliance',
    description: 'Payment Card Industry Data Security Standard requirements for protecting cardholder data',
    tags: 'compliance, pci, payments, security, cardholder-data',
    content: `## Requirement 1 – Network Security Controls
- Firewall rules must restrict inbound and outbound traffic to only what is necessary
- DMZ must be implemented for public-facing applications
- Internal network segmentation must isolate cardholder data environments (CDE)

## Requirement 2 – Secure Configurations
- Vendor-supplied default passwords must be changed before deployment
- Unnecessary services, protocols, and ports must be disabled
- System configurations must be hardened per industry benchmarks (CIS)
- Only one primary function per server/container

## Requirement 3 – Protect Stored Account Data
- Primary Account Numbers (PAN) must be rendered unreadable anywhere it is stored
- Encryption keys must be stored separately from encrypted data
- PAN must never be stored in logs, debug output, or error messages
- Data retention policies must limit cardholder data storage to business need
- Display masking: show only first 6 and last 4 digits of PAN maximum

## Requirement 4 – Encrypt Transmission Over Open Networks
- Strong cryptography (TLS 1.2+) required for all cardholder data transmission
- Certificate validation must be properly implemented
- Insecure protocols (SSL, early TLS) must be disabled

## Requirement 5 – Protect Against Malicious Software
- Anti-malware solutions must be deployed on all systems in CDE
- Dependency vulnerability scanning must be integrated in CI/CD
- File integrity monitoring must be in place for critical system files

## Requirement 6 – Develop and Maintain Secure Systems
- Security patches must be applied within 30 days of release (critical: 7 days)
- Custom code must be reviewed for OWASP Top 10 vulnerabilities
- Input validation must be implemented for all user-supplied data
- Output encoding must prevent injection attacks
- Public-facing web applications must be protected by WAF or code review

## Requirement 7 – Restrict Access by Business Need
- Access to cardholder data must follow principle of least privilege
- Access control systems must default to "deny all"
- RBAC must be implemented for all CDE systems

## Requirement 8 – Identify Users and Authenticate Access
- Unique IDs must be assigned to each person with computer access
- MFA required for all access to CDE
- Passwords must be minimum 12 characters
- Account lockout after no more than 10 invalid login attempts
- Idle sessions must time out after 15 minutes

## Requirement 10 – Log and Monitor All Access
- Audit trails must link all access to individual users
- All actions by root/admin must be logged
- Logs must be secured and retained for at least 12 months
- Time synchronization (NTP) must be implemented across all systems
- Log tampering detection must be in place

## Requirement 11 – Test Security Regularly
- Vulnerability scans must be performed quarterly
- Penetration testing must be performed annually
- Intrusion detection/prevention systems must be deployed
- Change detection mechanisms must alert on unauthorized modifications`,
  },
  gdpr: {
    name: 'GDPR Technical Compliance',
    description: 'EU General Data Protection Regulation technical requirements for processing personal data',
    tags: 'compliance, gdpr, privacy, eu, data-protection',
    content: `## Article 5 – Data Processing Principles
- Personal data collection must be limited to what is strictly necessary (data minimization)
- Purpose of data collection must be documented in code comments or configuration
- Data retention periods must be defined and enforced programmatically
- Automated data deletion/anonymization must be implemented for expired retention periods

## Article 6 – Lawful Basis for Processing
- Each data processing operation must have a documented legal basis
- Consent must be freely given, specific, informed, and unambiguous
- Consent records must include timestamp, scope, and method of collection
- Consent withdrawal must be as easy as giving consent

## Article 13/14 – Information and Transparency
- Privacy notice must be accessible at all data collection points
- Data processing activities must be documented in a processing register
- Third-party data sharing must be disclosed and documented

## Article 15-20 – Data Subject Rights
- Export endpoint must provide all personal data in machine-readable format (right of access/portability)
- Deletion endpoint must remove all personal data across all systems (right to erasure)
- Rectification endpoint must allow users to update their personal data
- Processing restriction mechanism must be implementable per user
- Automated decision-making must allow users to request human review

## Article 25 – Data Protection by Design and Default
- Privacy settings must default to the most protective option
- Personal data must be pseudonymized where possible
- Data fields must use encryption at rest (AES-256 or equivalent)
- Access to personal data must be logged and auditable
- New features must undergo a data protection impact assessment

## Article 28 – Processor Requirements
- Third-party APIs receiving personal data must have Data Processing Agreements
- Sub-processors must be documented and approved
- Data transfer outside EU/EEA must use approved mechanisms (SCCs, adequacy decisions)

## Article 32 – Security of Processing
- Encryption must be applied to personal data at rest and in transit
- Access controls must ensure only authorized personnel access personal data
- Regular testing of security measures must be documented
- Pseudonymization and anonymization must be used where feasible
- Incident detection and response capabilities must be in place

## Article 33/34 – Breach Notification
- Data breach detection mechanisms must be implemented
- Breach notification system must be capable of alerting within 72 hours
- Breach logging must capture scope, affected data subjects, and remediation steps

## Article 35 – Data Protection Impact Assessment
- High-risk processing must have documented DPIA
- DPIA must evaluate necessity, proportionality, and risks
- Mitigation measures must be implemented before processing begins

## Technical Implementation Checks
- No personal data in application logs (or properly masked)
- Database queries for personal data must be parameterized
- API responses must not over-expose personal data fields
- Test data must not contain real personal data
- Cookie consent must be implemented for tracking cookies
- Analytics must respect Do Not Track (DNT) headers or consent preferences`,
  },
  iso27001: {
    name: 'ISO 27001:2022 Controls',
    description: 'Information security management system controls from ISO/IEC 27001 Annex A',
    tags: 'compliance, iso27001, isms, security, international',
    content: `## A.5 – Organizational Controls
- Information security policies must be documented and reviewed annually
- Security roles and responsibilities must be clearly defined
- Segregation of duties must be enforced in critical operations
- Contact with relevant authorities and special interest groups must be maintained
- Threat intelligence must be collected and analyzed

## A.6 – People Controls
- Security screening must be performed before granting access
- Security awareness training must be mandatory for all team members
- Disciplinary process must be defined for security violations
- Confidentiality agreements must be in place for all personnel

## A.7 – Physical Controls (Application Layer)
- Clean desk/clear screen policies must be enforceable via auto-lock
- Equipment disposal must ensure data is securely erased
- Storage media must be encrypted

## A.8 – Technological Controls

### A.8.1-8.5 – Access Management
- User access must follow formal registration and de-registration process
- Privileged access rights must be restricted and monitored
- Authentication must use strong mechanisms (MFA where applicable)
- Access rights must be reviewed at defined intervals (quarterly minimum)
- Secure authentication information management (no plaintext passwords)

### A.8.6-8.10 – Capacity and Infrastructure
- Capacity management must include monitoring and alerting
- Malware protection must be implemented across all environments
- Technical vulnerabilities must be managed with defined remediation timelines
- Configuration management must enforce approved baselines
- Data deletion must be verified and irreversible

### A.8.11-8.16 – Data Protection
- Data masking must be applied to sensitive information in non-production environments
- Data leakage prevention controls must be in place
- Information backup must be tested regularly for recoverability
- Redundancy must be implemented for critical systems
- Logging must capture security-relevant events
- Activity monitoring must detect anomalous behavior

### A.8.17-8.22 – Operations Security
- Clock synchronization (NTP) must be consistent across systems
- Use of privileged utility programs must be restricted
- Software installation must be controlled and verified
- Network security must include segmentation and monitoring
- Web filtering must block known malicious sites
- Cryptography must follow approved algorithms and key management practices

### A.8.23-8.28 – Development Security
- Secure development lifecycle must be followed
- Security requirements must be defined for all application features
- Secure coding principles must be enforced (input validation, output encoding)
- Secure architecture and design principles must be documented
- Automated security testing must be integrated in CI/CD
- Separation of development, testing, and production environments

### A.8.29-8.34 – Monitoring and Compliance
- Security during disruptions must be planned and tested
- ICT readiness for business continuity must be verified
- Legal and regulatory requirements must be identified and tracked
- Intellectual property rights must be respected
- Protection of records must meet legal obligations
- Privacy and PII protection must comply with relevant legislation`,
  },
  owasp: {
    name: 'OWASP Top 10 (2021) Security',
    description: 'Open Web Application Security Project Top 10 most critical web application security risks',
    tags: 'security, owasp, web, application-security, vulnerabilities',
    content: `## A01:2021 – Broken Access Control
- Server-side access control enforcement required (never rely on client-side only)
- Default deny: access must be explicitly granted, not implicitly available
- CORS configuration must be restrictive and whitelist-based
- Directory listing must be disabled on web servers
- JWT tokens must be validated and invalidated on logout
- Rate limiting must be applied to API and controller access
- Access control failures must be logged and trigger alerts
- Insecure direct object references (IDOR) must be prevented with authorization checks

## A02:2021 – Cryptographic Failures
- Data must be classified by sensitivity level (public, internal, confidential, restricted)
- No unnecessary storage of sensitive data
- Sensitive data must be encrypted at rest (AES-256 or equivalent)
- Data in transit must use TLS 1.2+ (disable SSL, TLS 1.0, TLS 1.1)
- Strong key management: keys must not be hardcoded or stored with data
- Passwords must use strong adaptive hashing (bcrypt, scrypt, Argon2)
- Initialization vectors must be cryptographically random and never reused
- Deprecated hash functions (MD5, SHA1) must not be used for security purposes

## A03:2021 – Injection
- All user input must be validated, filtered, and sanitized
- SQL queries must use parameterized statements or ORM with bound parameters
- Use LIMIT and other SQL controls to prevent mass data disclosure
- Server-side input validation with allow-lists (positive validation)
- Special characters must be escaped using interpreter-specific escape syntax
- LDAP, OS command, XPath, and NoSQL injection must be prevented
- Static analysis (SAST) and dynamic analysis (DAST) tools must be in CI/CD pipeline

## A04:2021 – Insecure Design
- Threat modeling must be performed for critical features
- Unit and integration tests must include abuse case testing
- Plausibility checks must be implemented (e.g., data range validation)
- Rate limiting and resource consumption controls at all tiers
- Segregation of tenants must be enforced in multi-tenant architectures

## A05:2021 – Security Misconfiguration
- Hardened configuration with no unnecessary features, components, or documentation
- Default credentials must be changed or disabled
- Error handling must not reveal stack traces or sensitive details
- Security headers must be configured: CSP, X-Content-Type-Options, X-Frame-Options
- Cloud storage permissions must not allow public access by default
- Automated verification of configurations across all environments

## A06:2021 – Vulnerable and Outdated Components
- Dependency inventory must be maintained and current
- Continuous monitoring for CVEs in dependencies (Dependabot, Snyk, etc.)
- Components must be obtained from official sources over secure links
- Unmaintained libraries must be identified and replaced
- Patch management process with defined SLAs (critical: 7 days, high: 30 days)

## A07:2021 – Identification and Authentication Failures
- Multi-factor authentication must be implemented for sensitive operations
- No default, weak, or well-known passwords allowed
- Credential recovery must use secure, time-limited mechanisms
- Password complexity: minimum 12 characters, check against breached password databases
- Account lockout with escalating delays (not permanent lockout)
- Session identifiers must be cryptographically random and invalidated on logout
- Session timeout appropriate to application risk level

## A08:2021 – Software and Data Integrity Failures
- Dependencies and builds must use integrity verification (checksums, signatures)
- CI/CD pipelines must include security review and approval gates
- Unsigned or unverified serialized data must not be sent to untrusted clients
- Deserialization of untrusted data must be avoided or strictly validated
- Digital signatures must verify software and data updates

## A09:2021 – Security Logging and Monitoring Failures
- All login, access control, and server-side validation failures must be logged
- Logs must have sufficient context for delayed forensic analysis
- Log format must be compatible with centralized log management solutions
- Logs must not contain sensitive data (passwords, tokens, PII)
- High-value transactions must have audit trails with integrity controls
- Alerting thresholds and escalation procedures must be defined
- Incident response and recovery plans must be in place and tested

## A10:2021 – Server-Side Request Forgery (SSRF)
- URL validation must be enforced for all server-side requests
- Allow-list approach for permitted destinations (hostnames, IP ranges)
- Block access to metadata endpoints (169.254.169.254, etc.)
- Disable HTTP redirects for server-side requests
- Do not send raw responses from server-side requests to clients`,
  },
  nist_csf: {
    name: 'NIST Cybersecurity Framework',
    description: 'National Institute of Standards and Technology Cybersecurity Framework core functions for managing security risk',
    tags: 'compliance, nist, csf, security, risk-management, federal',
    content: `## Identify (ID)

### ID.AM – Asset Management
- All software components and dependencies must be inventoried
- Data flows must be documented (what data goes where)
- External information systems and services must be catalogued
- Resource prioritization must be based on classification and business value

### ID.RA – Risk Assessment
- Threat modeling must be performed for critical application features
- Vulnerabilities must be identified through automated scanning
- Risk must be assessed based on likelihood and impact
- Risk responses must be documented and tracked

### ID.GV – Governance
- Security policies must be established and communicated
- Legal and regulatory requirements must be identified
- Security roles and responsibilities must be defined

## Protect (PR)

### PR.AC – Access Control
- Identities and credentials must be managed for authorized users
- Remote access must be managed and monitored
- Access permissions must follow principle of least privilege
- Network segmentation must protect sensitive systems
- Authentication must use MFA for privileged and remote access

### PR.DS – Data Security
- Data at rest must be encrypted (AES-256)
- Data in transit must be encrypted (TLS 1.2+)
- Assets must be formally managed through removal, transfer, and disposition
- Adequate capacity must be maintained to ensure availability
- Data leakage protection measures must be implemented
- Integrity checking must verify software and data integrity

### PR.IP – Information Protection
- Baseline configurations must be established and maintained
- System Development Life Cycle (SDLC) must include security practices
- Configuration change control must be in place
- Backups must be conducted, maintained, and tested
- Destruction policies for data and devices must be enforced
- Continuous improvement of protection processes

### PR.PT – Protective Technology
- Audit and log records must be maintained and reviewed
- Removable media must be restricted and controlled
- Least functionality principle must be applied to systems
- Communication and control networks must be protected

## Detect (DE)

### DE.AE – Anomalies and Events
- Baseline of network and application operations must be established
- Detected events must be analyzed for impact and scope
- Event data must be aggregated and correlated across sources
- Incident alert thresholds must be defined

### DE.CM – Continuous Monitoring
- Network must be monitored for security events
- Physical environment monitoring where applicable
- Personnel activity must be monitored for unauthorized access
- Malicious code must be detected
- Unauthorized mobile code must be detected
- External service provider activity must be monitored
- Vulnerability scans must be performed regularly

### DE.DP – Detection Processes
- Detection roles and responsibilities must be defined
- Detection activities must comply with requirements
- Detection processes must be tested
- Event detection information must be communicated

## Respond (RS)

### RS.RP – Response Planning
- Incident response plan must be established and executable
- Response procedures must be documented for common incident types

### RS.CO – Communications
- Personnel must know their roles during incident response
- Events must be reported consistent with established criteria
- Information sharing must occur per response plans
- Coordination with stakeholders must occur per policy

### RS.MI – Mitigation
- Incidents must be contained
- Incidents must be mitigated
- Newly identified vulnerabilities must be mitigated or documented as accepted risk

## Recover (RC)

### RC.RP – Recovery Planning
- Recovery plan must be executed during or after an incident
- Recovery processes must be documented and tested

### RC.IM – Improvements
- Recovery plans must incorporate lessons learned
- Recovery strategies must be updated based on incidents`,
  },
  ccpa: {
    name: 'CCPA / CPRA Compliance',
    description: 'California Consumer Privacy Act and California Privacy Rights Act technical requirements',
    tags: 'compliance, ccpa, cpra, privacy, california, data-protection',
    content: `## §1798.100 – Consumer Right to Know
- Disclosure mechanism must list categories of personal information collected
- Purpose of collection must be documented for each data category
- Third-party sharing must be disclosed with categories of recipients
- API/UI must allow consumers to request their collected personal information
- Response to access requests must be provided within 45 days

## §1798.105 – Right to Delete
- Deletion endpoint must be implemented for consumer personal information
- Deletion must propagate to all service providers and third parties
- Exceptions to deletion must be documented (legal holds, security, etc.)
- Deletion confirmation must be provided to the consumer
- Verification of identity must precede deletion processing

## §1798.106 – Right to Correct
- Correction mechanism must allow consumers to update inaccurate personal information
- Corrected data must be propagated to service providers
- Commercial reasonable efforts to verify correction requests

## §1798.110 – Right to Know What Information is Collected
- Categories of personal information must be enumerable
- Sources of personal information must be documented
- Business or commercial purpose for collection must be stated
- Categories of third parties with whom data is shared must be listed

## §1798.115 – Right to Know About Selling/Sharing
- Disclosure of whether personal information is sold or shared
- Categories of personal information sold/shared must be listed
- Categories of third parties to whom data is sold/shared
- "Do Not Sell or Share My Personal Information" link must be provided

## §1798.120 – Right to Opt-Out of Sale/Sharing
- Opt-out mechanism must be prominently available
- Opt-out preference must be respected within 15 business days
- Opt-out signal detection (Global Privacy Control / GPC) must be honored
- Re-authorization to sell must not be requested for 12 months

## §1798.121 – Right to Limit Use of Sensitive Personal Information
- Sensitive personal information categories must be identified and flagged
- Limitation mechanism must restrict processing to necessary purposes
- "Limit the Use of My Sensitive Personal Information" link must be provided

## §1798.125 – Non-Discrimination
- Service quality must not differ based on privacy rights exercise
- Financial incentive programs must be clearly disclosed
- Price or service differences must be reasonably related to data value

## §1798.130 – Methods for Submitting Requests
- Minimum two methods for submitting requests (web form + one other)
- Toll-free phone number or equivalent must be available
- Response timelines: acknowledge within 10 days, fulfill within 45 days
- Verification process must not require account creation

## Technical Implementation Requirements
- Personal information inventory with data mapping
- Automated data subject request (DSR) processing pipeline
- Consent management platform with preference storage
- Data classification tagging in database schemas
- Audit trail for all DSR processing
- Age verification for consumers under 16 (opt-in required for selling)
- Service provider contracts must include CCPA-required provisions
- Annual review of data practices and privacy notice updates`,
  },
  fedramp: {
    name: 'FedRAMP Security Controls',
    description: 'Federal Risk and Authorization Management Program security controls for cloud services used by US government',
    tags: 'compliance, fedramp, federal, government, cloud-security',
    content: `## AC – Access Control
- AC-2: Account management with automated audit of account creation, modification, and removal
- AC-3: Access enforcement using RBAC with deny-by-default
- AC-6: Least privilege enforced at application, database, and infrastructure levels
- AC-7: Unsuccessful login attempts limited (lock after 3 attempts for 30 minutes)
- AC-8: System use notification (login banners) must be displayed
- AC-10: Concurrent session control must be enforced
- AC-11: Session lock after 15 minutes of inactivity
- AC-17: Remote access must use encrypted channels with MFA
- AC-22: Publicly accessible content must be reviewed and authorized

## AU – Audit and Accountability
- AU-2: Auditable events must include logins, logouts, access to objects, admin actions
- AU-3: Audit records must contain type, time, location, source, outcome, identity
- AU-4: Audit storage capacity must be allocated and monitored
- AU-6: Audit logs must be reviewed at least weekly
- AU-8: Timestamps must use authoritative time source (NTP)
- AU-9: Audit records must be protected from unauthorized access or modification
- AU-11: Audit record retention for minimum 90 days online, 1 year archived
- AU-12: Audit generation at all required system components

## CA – Assessment, Authorization, and Monitoring
- CA-2: Security assessments conducted annually
- CA-7: Continuous monitoring strategy must be implemented
- CA-8: Penetration testing annually for High, every 3 years for Moderate

## CM – Configuration Management
- CM-2: Baseline configurations documented and maintained
- CM-3: Configuration change control with impact analysis
- CM-6: Security configuration settings per hardening benchmarks
- CM-7: Least functionality – disable unnecessary ports, protocols, services
- CM-8: System component inventory maintained and updated

## IA – Identification and Authentication
- IA-2: Unique user identification with MFA for privileged and network access
- IA-4: Identifier management with defined lifecycle
- IA-5: Authenticator management (passwords: 12+ chars, complexity, 60-day rotation)
- IA-6: Authenticator feedback must be obscured (mask passwords)
- IA-8: Non-organizational user identification and authentication

## IR – Incident Response
- IR-1: Incident response policy and procedures documented
- IR-4: Incident handling process: preparation, detection, containment, eradication, recovery
- IR-5: Incident monitoring and documentation
- IR-6: Incident reporting to US-CERT within 1 hour of determination
- IR-8: Incident response plan tested annually

## SC – System and Communications Protection
- SC-7: Boundary protection with managed interfaces
- SC-8: Transmission confidentiality and integrity (TLS 1.2+ mandatory)
- SC-12: Cryptographic key establishment and management
- SC-13: Use of FIPS 140-2/140-3 validated cryptographic modules
- SC-28: Protection of information at rest (FIPS-validated encryption)

## SI – System and Information Integrity
- SI-2: Flaw remediation (critical: 30 days, high: 90 days)
- SI-3: Malicious code protection with automatic updates
- SI-4: System monitoring with inbound and outbound traffic analysis
- SI-5: Security alerts and advisories must be received and acted upon
- SI-10: Information input validation on all user-supplied data
- SI-11: Error handling must not reveal system internals

## RA – Risk Assessment
- RA-3: Risk assessment conducted annually and documented
- RA-5: Vulnerability scanning monthly (OS) and annually (web app/database)

## SA – System and Services Acquisition
- SA-11: Developer security testing (SAST, DAST, penetration testing)
- SA-22: Unsupported system components must be replaced or mitigated`,
  },
}

interface CreatePolicyProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePolicy({ open, onOpenChange, onSuccess }: CreatePolicyProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [framework, setFramework] = useState('custom')
  const [tags, setTags] = useState('')

  const handleFrameworkChange = (value: string) => {
    setFramework(value)
    const template = POLICY_TEMPLATES[value]
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setContent(template.content)
      setTags(template.tags)
    }
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createPolicy({
        name,
        description,
        content,
        framework,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast({ title: 'Policy created', description: `${name} is ready to use in assessments` })
      resetForm()
      onSuccess()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create policy', variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setContent('')
    setFramework('custom')
    setTags('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-purple-600" />
            </div>
            Create Assessment Policy
          </DialogTitle>
          <DialogDescription>
            Define compliance rules and standards that your codebases will be assessed against
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">Policy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Internal Security Standards v2"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          {/* Framework */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">Framework</label>
            <select
              value={framework}
              onChange={(e) => handleFrameworkChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {FRAMEWORKS.map(fw => (
                <option key={fw.value} value={fw.value}>{fw.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what this policy checks"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">
              Policy Content
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Write the full policy rules, checklist items, and requirements. This will be fed to the AI agent during assessment.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Example:\n\n## Authentication\n- All endpoints must require authentication\n- Passwords must be hashed with bcrypt (min 12 rounds)\n- JWT tokens must expire within 24 hours\n\n## Data Protection\n- PII must be encrypted at rest\n- All API responses must strip internal IDs\n- Database queries must use parameterized statements`}
              rows={12}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="security, compliance, internal"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || !content || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
