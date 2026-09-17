# Eikon Mind GDPR Audit

- **Assessment date:** 14 September 2026
- **Review level:** L2 privacy and security implementation review
- **Scope:** the Next.js/OpenNext application in this repository. The legacy WordPress site currently served from `eikon-mind.ro` is out of scope.
- **Controller:** Eikon Mind – Cabinet individual de psihologie / Individual Psychology Practice.

## Standards snapshot

| Source | Version/date checked | Applies to |
| --- | --- | --- |
| Regulation (EU) 2016/679 (GDPR) | In force; checked 14 September 2026 | Lawfulness, transparency, special-category data, rights, security, processors, transfers, DPIA |
| Directive 2002/58/EC, Article 5(3) | Current consolidated version; checked 14 September 2026 | Cookies, local storage, and similar terminal-equipment technologies |
| EDPB Guidelines 2/2023 | Version 2.0, adopted 7 October 2024 | Technical scope of Article 5(3) ePrivacy rules |
| EDPB Guidelines 4/2019 | Version 2.0, adopted 20 October 2020 | Data protection by design and by default |
| EDPB Guidelines 05/2020 | Version 1.1, adopted 4 May 2020 | Consent if optional technologies are introduced |
| ANSPDCP Decision 174/2018 | Checked 14 September 2026 | Romanian DPIA screening |

Official references: [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/), [ePrivacy Directive](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32002L0058), [EDPB ePrivacy guidance](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en), [EDPB Article 25 guidance](https://www.edpb.europa.eu/documents/guideline/guidelines-42019-on-article-25-data-protection-by-design-and-by-default_en), and [ANSPDCP Decision 174/2018](https://www.dataprotection.ro/servlet/ViewDocument?id=1556).

No client-specific privacy policy, DPA, RoPA, LIA, DPIA, or breach procedure is stored in this repository. Endava internal standards are not evidence for this client system and were not used as a substitute.

## Data-flow inventory

| Processing | Personal data | Purpose and proposed basis | Recipients | Retention |
| --- | --- | --- | --- | --- |
| Account and authentication | Name, email, verification state, password hash, session state, provider identifier, encrypted 2FA data | Account operation: Art. 6(1)(b); security: Art. 6(1)(f) | Authorised staff, Cloudflare, optional Google Sign-In | Account lifecycle; deletion request de-identifies immediately and removes the record after 30 days |
| Booking | Account link, therapist link, time range, status, timestamps | Requested psychological-service booking: Art. 6(1)(b); health-context analysis: Art. 9(2)(h), subject to legal confirmation | Authorised therapist/staff, Cloudflare, Google Calendar | 30 days after appointment; cancelled bookings 14 days after last update |
| Transactional email | Recipient email, sender, generic subject/body, security link where applicable | Account and booking operation/security | Resend | Provider contract and verified provider retention only |
| Security controls | Rate-limit key, security-event identifiers, transient request/security signals | Fraud and account protection: Art. 6(1)(f) | Cloudflare and authorised staff | Events 14 days; rate-limit records 1 day |
| Browser technologies | Essential auth cookies, Turnstile technologies, local visual/music preferences | Authentication, abuse prevention, or user-requested preference | Browser; Cloudflare for Turnstile | Session up to 7 days; 2FA 10 minutes; preferences until deleted |

The application intentionally does not collect clinical notes, diagnoses, symptoms, therapy documents, or free-text booking notes. Nevertheless, the fact of booking with a psychology practice is treated as health-context data.

## Findings and remediation

| Finding | Status after this change | Required owner action |
| --- | --- | --- |
| Notices did not fully satisfy Article 13 or accurately describe Google, Turnstile, transfers, or retention | Remediated in Romanian and English content | Controller validates factual accuracy before release |
| Legacy cookie text named technologies not deployed by this application | Remediated with observed essential cookies, Turnstile, and local storage only | Re-test after any dependency or provider change |
| Therapy testimonials disclosed health-related narratives with images/initials | Remediated by removing the public section | Keep removed unless documented explicit publication consent exists |
| No self-service portability route | Remediated with an authenticated account/booking PDF summary export | Controller handles non-portable or broader access requests by email |
| Minor clinical consent/documents were not delimited from the app | Remediated in both Terms pages | Therapist handles representation and documents directly outside the app |
| Production retention values and evidence are external to source control | Open release gate | Configure 30/14/30/14 values in the protected workspace and retain approval reference outside Git |

## DPIA, RoPA, and transfer screening

The codebase applies minimisation, role controls, encryption, short retention, and no clinical-content fields. It does not itself prove that a full DPIA is unnecessary. Before production use, the controller must document a DPIA threshold assessment under Article 35 GDPR and ANSPDCP Decision 174/2018. Complete a full DPIA before launch if the assessment identifies high risk, large-scale health-data processing, systematic monitoring, or a material change in technology or scope.

The controller must maintain a RoPA covering the processing above and a legitimate-interest assessment for security controls. It must sign and retain current Article 28 DPAs, subprocessors, transfer-impact assessments, and applicable adequacy/SCC evidence for Cloudflare, Resend, and Google. D1 EU jurisdiction does not by itself establish EU-only processing.

## Release gates

Do not represent the application as fully GDPR compliant until all of the following are complete:

1. The controller and legal adviser confirm the Article 9(2)(h) health-care/professional-secrecy basis for booking data.
2. Production uses the approved retention values: 30 days for normal appointments and de-identified records, 14 days for cancelled appointments and security events.
3. DPA, subprocessor, international-transfer, RoPA, LIA, DPIA-screening, data-subject-rights, and breach-response evidence is approved and retained outside the repository.
4. The production cookie inventory is rechecked after deployment; optional analytics, advertising, or social tracking remains blocked unless valid granular consent is implemented.

For an incident involving personal data, the controller must assess it promptly, document the decision, notify the supervisory authority within the applicable GDPR deadline where required, and notify affected people where the statutory risk threshold is met.
