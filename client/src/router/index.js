import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import Login from '@/views/Login.vue'
import Signup from '@/views/Signup.vue'
import Dashboard from '@/views/Dashboard.vue'
import EmployeeMasterlist from '@/views/employees/EmployeeMasterlist.vue'
import EmployeeForm from '@/views/employees/EmployeeForm.vue'
import BirthdayCelebrants from '@/views/employees/BirthdayCelebrants.vue'
import DTRTransmittal from '@/views/dtr/DTRTransmittal.vue'
import LeaveManagement from '@/views/leave/LeaveManagement.vue'
import TOManagement from '@/views/to/TOManagement.vue'
import Verification from '@/views/verification/Verification.vue'
import TrackingReceiving from '@/views/tracking/TrackingReceiving.vue'
import Signatories from '@/views/signatories/Signatories.vue'
import AuditTransmittal from '@/views/audit/AuditTransmittal.vue'
import ScheduleDatabase from '@/views/schedule/ScheduleDatabase.vue'
import AIScanningTools from '@/views/ai/AIScanningTools.vue'
import TrainingsManagement from '@/views/trainings/TrainingsManagement.vue'
import DepartmentManagement from '@/views/departments/DepartmentManagement.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/signup', name: 'Signup', component: Signup, meta: { public: true } },
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/employees', name: 'EmployeeMasterlist', component: EmployeeMasterlist },
  { path: '/employees/new', name: 'EmployeeNew', component: EmployeeForm },
  { path: '/employees/:id/edit', name: 'EmployeeEdit', component: EmployeeForm },
  { path: '/employees/birthdays', name: 'BirthdayCelebrants', component: BirthdayCelebrants },
  { path: '/dtr', name: 'DTRTransmittal', component: DTRTransmittal },
  { path: '/leave', name: 'LeaveManagement', component: LeaveManagement },
  { path: '/to', name: 'TOManagement', component: TOManagement },
  { path: '/verification', name: 'Verification', component: Verification },
  { path: '/tracking', name: 'TrackingReceiving', component: TrackingReceiving },
  { path: '/signatories', name: 'Signatories', component: Signatories },
  { path: '/audit', name: 'AuditTransmittal', component: AuditTransmittal },
  { path: '/schedule', name: 'ScheduleDatabase', component: ScheduleDatabase },
  { path: '/ai-scanning', name: 'AIScanningTools', component: AIScanningTools },
  { path: '/trainings', name: 'TrainingsManagement', component: TrainingsManagement },
  { path: '/departments', name: 'DepartmentManagement', component: DepartmentManagement },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return next('/login')
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return next('/')
  }
  // Block signup page if account limit reached
  if (to.path === '/signup' && auth.accountLimitReached) {
    return next('/login')
  }
  next()
})

export default router
