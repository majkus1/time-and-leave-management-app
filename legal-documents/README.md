# Legal Documents

This directory contains the legal documents for Planopia.pl in Markdown format.

## Documents

- `TERMS.md` - Terms and Conditions (Regulamin świadczenia usługi)
- `PRIVACY.md` - Privacy Policy (Polityka prywatności)
- `DPA.md` - Data Processing Agreement (Umowa powierzenia przetwarzania danych)

## Publishing Documents

To publish a new version of a document, use the seed script:

```bash
node server/scripts/seedLegalDocuments.js publish TERMS 1.0 2026-01-15
node server/scripts/seedLegalDocuments.js publish PRIVACY 1.0 2026-01-15
node server/scripts/seedLegalDocuments.js publish DPA 1.0 2026-01-15
```

## Placeholders

Documents contain placeholders that should be replaced before publishing:

- `[NAZWA FIRMY]` - Company name
- `[ADRES]` - Company address
- `[NIP]` - Tax ID (NIP)
- `[EMAIL KONTAKT]` - Contact email
- `[HOSTING/PROVIDER]` - Hosting provider
- `[KRAJ HOSTINGU]` - Hosting country
- `[DATA WEJŚCIA W ŻYCIE]` - Effective date

