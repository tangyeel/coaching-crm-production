// Portal roles
export enum Roles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

// Institute status
export enum InstituteStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Subscription Plans
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// Student fee status
export enum FeeStatus {
  PAID = 'PAID',
  DUE = 'DUE',
}

// UI Chart color palettes
export const CHART_THEME_COLORS = [
  '#F0B429', // Gold
  '#06B6D4', // Cyan
  '#10B981', // Emerald Green
  '#A855F7', // Violet/Purple
  '#EF4444', // Red
]
export const GREY_COLOR = '#55556A'
export const EMERALD_GRADIENT = {
  top: 'rgba(16,185,129,0.18)',
  bottom: 'rgba(16,185,129,0)'
}
export const GOLD_GRADIENT = {
  top: 'rgba(240,180,41,0.15)',
  bottom: 'rgba(240,180,41,0)'
}
export const CYAN_GRADIENT = {
  top: 'rgba(6,182,212,0.2)',
  bottom: 'rgba(6,182,212,0)'
}
export const PURPLE_GRADIENT = {
  top: 'rgba(168,85,247,0.2)',
  bottom: 'rgba(168,85,247,0)'
}
