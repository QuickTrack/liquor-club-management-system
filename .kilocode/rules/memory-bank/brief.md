# Project Brief: Liquor Club Management System

## Purpose
Complete POS and inventory management system for a liquor club with staff authentication, shift management, financial tracking, and VAT-compliant sales.

## Target Users
- Cashiers/Bartenders
- Managers/Admins
- Waitstaff

## Core Use Cases
- Process sales with VAT calculation
- Track inventory in real-time
- Manage customer loyalty and credit
- Shift opening/closing with physical stock verification
- Financial reconciliation (cash, M-Pesa, card)
- Staff authentication with PIN

## Key Requirements
- Full POS interface with product catalog, cart, payment
- Inventory management with units of measure
- Customer and staff database
- M-Pesa integration
- Shift opening intake: cash float, M-Pesa balance, stock checklist
- Shift closing reconciliation
- Audit trail and reporting

## Success Metrics
- Accurate financial and inventory tracking
- Secure staff authentication
- Clean audit logs for shift handovers
- Zero-latency POS operations

## Constraints
- Next.js 16 + React 19 + Tailwind CSS 4
- Bun package manager
- MongoDB with ACID transactions
- VAT rate fixed at 16%
- Kenya Shillings (KES) currency
