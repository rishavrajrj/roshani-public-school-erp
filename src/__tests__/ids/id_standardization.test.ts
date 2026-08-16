import { describe, it, expect } from 'vitest'
import {
  generateStudentId,
  generateAdmissionNumber,
  generateGuardianId,
  generateEmployeeId,
  generateSessionCode,
  generateClassCode,
  generateSectionCode,
  generateInvoiceNumber,
  generateReceiptNumber,
  generatePaymentNumber,
  generateExaminationNumber,
  generateAdmitCardNumber,
  generateCertificateNumber,
  validateBusinessId,
  normalizeSchoolCode,
  ID_PATTERNS,
} from '@/lib/ids'

describe('Human-Readable Business ID Standardization & Concurrency Safety', () => {
  describe('1. Standard ID Format Generators', () => {
    it('generates compliant Student IDs', () => {
      const id1 = generateStudentId('RPS-NOIDA', 2026, 1)
      const id2 = generateStudentId('DIS-DELHI', 2026, 2)
      const id3 = generateStudentId('SCH-SUN-PATNA', 2026, 105)
      const id4 = generateStudentId('10022702717', 2026, 7)
      const id5 = generateStudentId('SCH-10022702717', 2026, 8)

      expect(id1).toBe('STU-RPS-NOIDA-2026-000001')
      expect(id2).toBe('STU-DIS-DELHI-2026-000002')
      expect(id3).toBe('STU-SUN-PATNA-2026-000105')
      expect(id4).toBe('STU-10022702717-2026-000007')
      expect(id5).toBe('STU-10022702717-2026-000008')
      expect(validateBusinessId(id1, 'STUDENT')).toBe(true)
      expect(validateBusinessId(id2, 'STUDENT')).toBe(true)
      expect(validateBusinessId(id3, 'STUDENT')).toBe(true)
      expect(validateBusinessId(id4, 'STUDENT')).toBe(true)
      expect(validateBusinessId(id5, 'STUDENT')).toBe(true)
    })

    it('generates compliant Admission Numbers distinct from Student IDs', () => {
      const adm1 = generateAdmissionNumber('RPS-NOIDA', 2026, 1)
      const stu1 = generateStudentId('RPS-NOIDA', 2026, 1)

      expect(adm1).toBe('ADM-RPS-NOIDA-2026-000001')
      expect(stu1).toBe('STU-RPS-NOIDA-2026-000001')
      expect(adm1).not.toBe(stu1)
      expect(validateBusinessId(adm1, 'ADMISSION')).toBe(true)
    })

    it('generates compliant Guardian IDs', () => {
      const gdn1 = generateGuardianId('RPS-NOIDA', 1)
      const gdn2 = generateGuardianId('DIS-DELHI', 45)

      expect(gdn1).toBe('GDN-RPS-NOIDA-000001')
      expect(gdn2).toBe('GDN-DIS-DELHI-000045')
      expect(validateBusinessId(gdn1, 'GUARDIAN')).toBe(true)
      expect(validateBusinessId(gdn2, 'GUARDIAN')).toBe(true)
    })

    it('generates compliant Employee & Teacher IDs', () => {
      const emp1 = generateEmployeeId('RPS-NOIDA', 2026, 1)
      const teacher1 = generateEmployeeId('RPS-NOIDA', 2026, 15)

      expect(emp1).toBe('EMP-RPS-NOIDA-2026-000001')
      expect(teacher1).toBe('EMP-RPS-NOIDA-2026-000015')
      expect(validateBusinessId(emp1, 'EMPLOYEE')).toBe(true)
      expect(validateBusinessId(teacher1, 'EMPLOYEE')).toBe(true)
    })

    it('generates academic structural identifiers (Sessions, Classes, Sections)', () => {
      const session = generateSessionCode('RPS-NOIDA', 2026)
      const clsNur = generateClassCode('RPS-NOIDA', 'NUR')
      const cls10 = generateClassCode('RPS-NOIDA', '10')
      const sec10A = generateSectionCode('RPS-NOIDA', '10', 'A')

      expect(session).toBe('SES-RPS-NOIDA-2026')
      expect(clsNur).toBe('CLS-RPS-NOIDA-NUR')
      expect(cls10).toBe('CLS-RPS-NOIDA-10')
      expect(sec10A).toBe('SEC-RPS-NOIDA-10-A')
    })

    it('generates financial transaction identifiers', () => {
      const inv = generateInvoiceNumber('RPS-NOIDA', 2026, 1)
      const rct = generateReceiptNumber('RPS-NOIDA', 2026, 125)
      const pay = generatePaymentNumber('RPS-NOIDA', 2026, 1)

      expect(inv).toBe('INV-RPS-NOIDA-2026-000001')
      expect(rct).toBe('RCT-RPS-NOIDA-2026-000125')
      expect(pay).toBe('PAY-RPS-NOIDA-2026-000001')
      expect(validateBusinessId(inv, 'INVOICE')).toBe(true)
      expect(validateBusinessId(rct, 'RECEIPT')).toBe(true)
      expect(validateBusinessId(pay, 'PAYMENT')).toBe(true)
    })

    it('generates examination and certificate identifiers', () => {
      const exm = generateExaminationNumber('RPS-NOIDA', 2026, 1)
      const admtc = generateAdmitCardNumber('RPS-NOIDA', 2026, 125)
      const certTc = generateCertificateNumber('RPS-NOIDA', 2026, 'TC', 1)
      const certBonafide = generateCertificateNumber('RPS-NOIDA', 2026, 'BONAFIDE', 2)

      expect(exm).toBe('EXM-RPS-NOIDA-2026-000001')
      expect(admtc).toBe('ADMTC-RPS-NOIDA-2026-000125')
      expect(certTc).toBe('CERT-RPS-NOIDA-2026-TC-000001')
      expect(certBonafide).toBe('CERT-RPS-NOIDA-2026-BONAFIDE-000002')
      expect(validateBusinessId(exm, 'EXAMINATION')).toBe(true)
      expect(validateBusinessId(admtc, 'ADMIT_CARD')).toBe(true)
      expect(validateBusinessId(certTc, 'CERTIFICATE')).toBe(true)
      expect(validateBusinessId(certBonafide, 'CERTIFICATE')).toBe(true)
    })
  })

  describe('2. Multi-Tenant Isolation & Collision Prevention', () => {
    it('ensures distinct tenant prefixes across schools', () => {
      const schools = ['RPS-NOIDA', 'DIS-DELHI', 'SUN-PATNA']
      const generated = schools.map((s) => generateStudentId(s, 2026, 1))

      expect(new Set(generated).size).toBe(3)
      expect(generated[0]).toContain('RPS-NOIDA')
      expect(generated[1]).toContain('DIS-DELHI')
      expect(generated[2]).toContain('SUN-PATNA')
    })

    it('generates 1,000 unique sequential identifiers without collision', () => {
      const generated = new Set<string>()
      for (let i = 1; i <= 1000; i++) {
        const id = generateStudentId('RPS-NOIDA', 2026, i)
        generated.add(id)
      }
      expect(generated.size).toBe(1000)
    })

    it('correctly rejects raw UUIDs as valid business IDs', () => {
      const rawUuid = '01617173-7545-4bbd-acd6-36f64f3eb6fd'
      expect(validateBusinessId(rawUuid, 'STUDENT')).toBe(false)
      expect(validateBusinessId(rawUuid, 'ADMISSION')).toBe(false)
      expect(validateBusinessId(rawUuid, 'GUARDIAN')).toBe(false)
      expect(validateBusinessId(rawUuid, 'INVOICE')).toBe(false)
    })
  })
})
